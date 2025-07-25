import { Context } from "lib";

// ┌────────── Public API ──────────┐
export { configureSignaling, handleSignaling };

// ┌──────────── Types ────────────┐
type SignalingMessage =
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "candidate"; candidate: RTCIceCandidateInit }
  | { type: "ping" }
  | { type: "ready" }; // server → client;

// ┌─────────── Constants ────────────┐
const CLOSE_CODE_ROOM_FULL = 4000;
const CLOSE_CODE_STALE = 4001;
const MAX_PEERS_PER_ROOM = 2;
const IDLE_TIMEOUT_MS = 60_000;
const PING_CHECK_INTERVAL = 15_000;

// ┌──────────── State ─────────────┐
const rooms = new Map<string, Set<WebSocket>>();
const peerToRoom = new Map<WebSocket, string>();
const lastSeen = new Map<WebSocket, number>();
const broadcastChannel = new BroadcastChannel("signaling");
let DEBUG_LOGS = true;

// ┌──────────── Configuration ────────────┐
function configureSignaling(options: { debug?: boolean } = {}): void {
  DEBUG_LOGS = Boolean(options.debug);
}

// ┌────── BroadcastChannel Relay ──────┐
broadcastChannel.onmessage = ({ data: { type, roomId, message } }) => {
  try {
    if (type !== "signal") return;
    const room = rooms.get(roomId);
    if (!room) return;
    logInfo(`🔁 BroadcastChannel → relayed message to room "${roomId}"`);
    for (const peer of room) sendToPeer(peer, JSON.stringify(message));
  } catch (err) {
    logError("Error handling BroadcastChannel message:", err);
  }
};

// ┌──────── Idle Timeout Loop ────────┐
setInterval(() => {
  const now = Date.now();
  for (const [peer, seen] of lastSeen) {
    if (now - seen > IDLE_TIMEOUT_MS) {
      const roomId = peerToRoom.get(peer);
      const idleSec = IDLE_TIMEOUT_MS / 1000;
      logWarn(
        `⏱️ Closing idle socket in room "${roomId}" — no ping in ${idleSec}s`,
      );
      peer.close(CLOSE_CODE_STALE, "Idle connection");
      removePeer(peer);
    }
  }
}, PING_CHECK_INTERVAL);

// ┌──────────── Socket Handler ────────────┐
function handleSignaling({ req, url }: Context): Response {
  const roomId = url.searchParams.get("room");
  if (!roomId) return new Response("Missing room ID", { status: 400 });
  const { socket, response } = Deno.upgradeWebSocket(req);
  socket.onopen = () => onSocketOpen(socket, roomId);
  socket.onmessage = (event) => onSocketMessage(socket, event);
  socket.onclose = () => onSocketClose(socket);
  socket.onerror = (event) => onSocketError(socket, event);
  return response;
}

// ┌──────────── Peer Methods  ────────────┐
function removePeer(peer: WebSocket): void {
  const roomId = peerToRoom.get(peer);
  lastSeen.delete(peer);
  peerToRoom.delete(peer);
  const room = rooms.get(roomId ?? "");
  if (!room) return;
  room.delete(peer);
  logInfo(`❌ Peer left room "${roomId}" — remaining: ${room.size}`);
  if (room.size === 0) rooms.delete(roomId!);
}

function sendToPeer(peer: WebSocket, message: string): void {
  if (peer.readyState === WebSocket.OPEN) {
    try {
      peer.send(message);
      logInfo("📤 Sent signaling message to peer");
    } catch (err) {
      logWarn("⚠️ Failed to send signaling message:", err);
    }
  }
}

// ┌──────────── Socket Message Validation ────────────┐
function isValidSignal(val: unknown): val is SignalingMessage {
  if (typeof val !== "object" || val === null) return false;
  const msg = val as Partial<SignalingMessage>;
  if (typeof msg.type !== "string") return false;
  switch (msg.type) {
    case "offer":
    case "answer":
      return typeof msg.sdp === "string";
    case "candidate":
      return typeof msg.candidate === "object" && msg.candidate !== null;
    case "ping":
      return true;
    default:
      return false;
  }
}

// ┌──────────── Socket Event Handlers ────────────┐
function onSocketOpen(socket: WebSocket, roomId: string): void {
  lastSeen.set(socket, Date.now());
  peerToRoom.set(socket, roomId);
  let room = rooms.get(roomId);
  if (!room) {
    room = new Set();
    rooms.set(roomId, room);
  }
  if (room.size >= MAX_PEERS_PER_ROOM) {
    logInfo(`🚫 Rejected peer — room "${roomId}" is full`);
    socket.close(CLOSE_CODE_ROOM_FULL, "Room full");
    removePeer(socket);
    return;
  }
  room.add(socket);
  if (room.size === 2) {
    for (const peer of room) {
      try {
        peer.send(JSON.stringify({ type: "ready" }));
      } catch {
        // optional: silently fail
      }
    }
  }
  logInfo(`🔌 Peer joined room "${roomId}" — peers: ${room.size}`);
}

function onSocketMessage(socket: WebSocket, event: MessageEvent): void {
  lastSeen.set(socket, Date.now());
  let message;
  try {
    message = JSON.parse(event.data);
  } catch {
    logWarn("Invalid JSON received from peer");
    return;
  }
  const roomId = peerToRoom.get(socket);
  if (!roomId) return;
  if (message?.type === "ping") {
    logInfo(`🏓 Ping received from peer in room "${roomId}"`);
    return;
  }
  if (!isValidSignal(message)) {
    logWarn("Invalid signaling message shape:", message);
    return;
  }
  const room = rooms.get(roomId);
  if (!room || !room.has(socket)) return;
  // Relay to local room
  for (const peer of room) {
    if (peer !== socket) sendToPeer(peer, JSON.stringify(message));
  }
  // Broadcast to other isolates
  try {
    broadcastChannel.postMessage({ type: "signal", roomId, message });
  } catch (err) {
    logError("BroadcastChannel postMessage failed:", err);
  }
}

function onSocketClose(socket: WebSocket): void {
  removePeer(socket);
}

function onSocketError(socket: WebSocket, event: Event | unknown): void {
  const roomId = peerToRoom.get(socket);
  const msg =
    `WebSocket error in room "${roomId}" (state: ${socket.readyState})`;
  logWarn(msg, event);
  removePeer(socket);
  socket.close();
}

// ┌──────────── Logging ────────────┐
function timestamp(): string {
  return new Date().toLocaleTimeString("en-GB");
}
function logInfo(msg: string, ...args: unknown[]) {
  if (DEBUG_LOGS) console.log(`[${timestamp()}] [signaling] ${msg}`, ...args);
}
function logWarn(msg: string, ...args: unknown[]) {
  console.warn(`[${timestamp()}] [signaling] ⚠️ ${msg}`, ...args);
}
function logError(msg: string, ...args: unknown[]) {
  console.error(`[${timestamp()}] [signaling] ❌ ${msg}`, ...args);
}
