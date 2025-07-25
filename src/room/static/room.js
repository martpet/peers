import { startWebRtc } from "../webrtc/static/webrtc.js";

const url = new URL(location);
const roomId = url.searchParams.get("room");

if (roomId) {
  startWebRtc(roomId);
}
