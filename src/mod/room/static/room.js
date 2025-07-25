import { startWebRTC } from "/webrtc/static/webrtc.js";

const url = new URL(location);
const roomId = url.searchParams.get("id");

if (!roomId) {
  throw new Error("Missing id URL param.");
}

startWebRTC(roomId);
