import {
  initiateSignaling,
  registerSignalingHandlers,
  sendSignalingMessage,
} from "./signaling.js";

// ┌────────── Public API ──────────┐
export { startWebRtc };

// ┌────────── State ──────────┐
let peerConnection;
let currentRoomId;

// ┌────────── Signaing Handlers Registration ──────────┐
registerSignalingHandlers({
  offer: onOffer,
  answer: onAnswer,
  candidate: onCandidate,
  reconnect: onReconnect,
});

// ┌────────── Join Logic ──────────┐
function startWebRtc(roomId) {
  currentRoomId = roomId;
  ensurePeerConnection();
  initiateSignaling(roomId);
}

// ┌────────── PeerConnection Setup ──────────┐
function ensurePeerConnection() {
  if (peerConnection) return peerConnection;
  peerConnection = new RTCPeerConnection();
  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) sendSignalingMessage({ type: "candidate", candidate });
  };
  // Additional event hooks optional
}

// ┌────── Signaling Handlers ──────┐
async function onOffer(sdp) {
  ensurePeerConnection();
  await peerConnection.setRemoteDescription({ type: "offer", sdp });
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  sendSignalingMessage({ type: "answer", sdp: answer.sdp });
}

async function onAnswer(sdp) {
  await peerConnection.setRemoteDescription({ type: "answer", sdp });
}

async function onCandidate(candidate) {
  await peerConnection.addIceCandidate(candidate);
}

async function onReconnect() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  startWebRtc(currentRoomId);
}
