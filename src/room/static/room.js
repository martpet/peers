import { startWebRTC } from "/webrtc/webrtc.js";

const url = new URL(location);
const roomId = url.searchParams.get("id");

if (!roomId) {
  throw new Error("Missing room ID in URL.");
}

startWebRTC(roomId);
