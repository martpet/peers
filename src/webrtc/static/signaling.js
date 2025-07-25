// ┌────────── Public API ──────────┐
export {
  closeSignaling,
  initiateSignaling,
  registerSignalingHandlers,
  sendSignalingMessage,
};

// ┌──────────── Constants ────────────┐
const CLOSE_CODE_NORMAL = 1000;
const CLOSE_CODE_GOING_AWAY = 1001;
const CLOSE_CODE_ROOM_FULL = 4000;
const CLOSE_CODE_STALE = 4001;
const MAX_RECONNECT_DELAY_MS = 30_000;
const PING_INTERVAL_MS = 20_000;

// ┌──────────── State ────────────┐
let socket;
let isConnected = false;
let pingInterval;
let reconnectAttempts = 0;
let hasConnectedOnce = false;

let onOffer = () => {};
let onAnswer = () => {};
let onCandidate = () => {};
let onReady = () => {};
let onReconnect = null;
let handlersRegistered = false;

// ┌───── Handler Registration ─────┐
function registerSignalingHandlers(handlers) {
  if (handlers.offer) onOffer = handlers.offer;
  if (handlers.answer) onAnswer = handlers.answer;
  if (handlers.candidate) onCandidate = handlers.candidate;
  if (handlers.ready) onReady = handlers.ready;
  if (handlers.reconnect) onReconnect = handlers.reconnect;
  handlersRegistered = true;
}

// ┌──────────── Cleanup ────────────┐
function cleanup() {
  clearInterval(pingInterval);
  pingInterval = undefined;
  isConnected = false;
}

// ┌──────────── Logging ────────────┐
function timestamp() {
  return new Date().toLocaleTimeString("en-GB");
}
function logInfo(msg, ...args) {
  console.log(`[${timestamp()}] [signaling] ${msg}`, ...args);
}
function logWarn(msg, ...args) {
  console.warn(`[${timestamp()}] [signaling] ⚠️ ${msg}`, ...args);
}
function logError(msg, ...args) {
  console.error(`[${timestamp()}] [signaling] ❌ ${msg}`, ...args);
}

// ┌───── Message Validation ─────┐
function isValidSignal(val) {
  if (typeof val !== "object" || val === null) return false;
  const type = val.type;
  if (typeof type !== "string") return false;
  switch (type) {
    case "offer":
    case "answer":
      return typeof val.sdp === "string";
    case "candidate":
      return typeof val.candidate === "object" && val.candidate !== null;
    case "ping":
    case "ready":
      return true;
    default:
      return false;
  }
}

// ┌───── Initialization ─────┐
function initiateSignaling(roomId) {
  if (!roomId) throw new Error("Missing room ID");

  if (socket?.readyState <= WebSocket.OPEN) {
    logWarn("Signaling WebSocket is already open or connecting.");
    return;
  }

  socket = new WebSocket(signalingUrl(roomId));

  socket.addEventListener("open", () => onSocketOpen(roomId));
  socket.addEventListener("message", onSocketMessage);
  socket.addEventListener("close", (event) => onSocketClose(event, roomId));
  socket.addEventListener("error", (event) => onSocketError(event, roomId));
}

// ┌──────────── Teardown ────────────┐
function closeSignaling() {
  cleanup();
  socket?.close(CLOSE_CODE_GOING_AWAY, "Client teardown");
}

// ┌───── WebSocket Handlers ─────┐
function onSocketOpen() {
  console.groupCollapsed(`[${timestamp()}] [signaling] 🔌 WebSocket Connected`);
  logInfo("Connected to signaling server");
  console.groupEnd();

  isConnected = true;
  reconnectAttempts = 0;

  if (hasConnectedOnce && typeof onReconnect === "function") {
    logInfo("🔁 Triggering reconnect handler");
    onReconnect();
  }

  hasConnectedOnce = true;

  pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify({ type: "ping" }));
        logInfo("🏓 Sent ping to server");
      } catch (err) {
        logError("Failed to send ping:", err);
      }
    }
  }, PING_INTERVAL_MS);
}

function onSocketMessage(event) {
  console.groupCollapsed(`[${timestamp()}] [signaling] 🔁 Message Received`);
  let data;
  try {
    data = JSON.parse(event.data);
    logInfo("Parsed signaling message:", data);
  } catch {
    logWarn(`Invalid JSON received: ${event.data}`);
    console.groupEnd();
    return;
  }

  if (!isValidSignal(data)) {
    logWarn("❌ Invalid signaling message format:", data);
    console.groupEnd();
    return;
  }

  handleSignalingMessage(data);
  console.groupEnd();
}

function onSocketClose(event, roomId) {
  cleanup();

  const code = event?.code;
  const reason = event?.reason || "no reason";

  console.groupCollapsed(`[${timestamp()}] [signaling] 🔌❌ WebSocket Closed`);
  logWarn(`Reason: ${reason}`);
  logWarn(`Code: ${code}`);
  console.groupEnd();

  const noRetryCloseCodes = [CLOSE_CODE_NORMAL, CLOSE_CODE_ROOM_FULL];
  if (noRetryCloseCodes.includes(code)) {
    logInfo("❎ No reconnect — intentional server disconnect.");
    return;
  }

  tryReconnect(roomId);
}

function onSocketError(event, roomId) {
  cleanup();

  console.groupCollapsed(`[${timestamp()}] [signaling] ❌ WebSocket Error`);
  logError("WebSocket encountered an error", event);
  console.groupEnd();

  tryReconnect(roomId);
}

// ┌───── Outgoing Messages ─────┐
function sendSignalingMessage(message) {
  if (!isConnected || socket.readyState !== WebSocket.OPEN) {
    logWarn("Cannot send message — WebSocket not connected");
    return;
  }

  try {
    socket.send(JSON.stringify(message));
    console.groupCollapsed(`[${timestamp()}] [signaling] 📤 Message Sent`);
    logInfo("Sent signaling message:", message);
    console.groupEnd();
  } catch (err) {
    logError("❌ Failed to send signaling message:", err);
  }
}

// ┌───── Incoming Messages ─────┐
function handleSignalingMessage(message) {
  if (!handlersRegistered) {
    logWarn(
      "⚠️ Received signaling message but no handlers are registered. Did you forget to call registerSignalingHandlers()?"
    );
    return;
  }

  logInfo("Handling signaling message 🔁", message);

  switch (message.type) {
    case "offer":
      onOffer(message.sdp);
      break;
    case "answer":
      onAnswer(message.sdp);
      break;
    case "candidate":
      onCandidate(message.candidate);
      break;
    case "ping":
      logInfo("🏓 Received ping from server");
      break;
    case "ready":
      logInfo("✅ Received 'ready' — both peers connected");
      onReady();
      break;
    default:
      logWarn("Unknown signaling message type:", message.type);
  }
}

// ┌──────────── Utilities ────────────┐
function signalingUrl(roomId) {
  const url = new URL(import.meta.url);
  url.protocol = url.protocol.replace("http", "ws");
  url.pathname = url.pathname.replace(".js", "");
  url.searchParams.set("room", roomId);
  return url.href;
}

function tryReconnect(roomId) {
  const delay = Math.min(1000 * reconnectAttempts, MAX_RECONNECT_DELAY_MS);
  logInfo(`🔁 Attempting to reconnect in ${delay / 1000}s...`);
  setTimeout(() => {
    reconnectAttempts++;
    initiateSignaling(roomId);
  }, delay);
}
