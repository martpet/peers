import {
  initiateSignaling,
  registerSignalingHandlers,
  sendSignalingMessage,
} from "./signaling.js";

// ┌────────── Public API ──────────┐
export { startWebRTC };

// ┌────────── WebRTC State ──────────┐
let peerConnection;
let currentRoomId;

// ┌────────── Initialization ──────────┐
registerSignalingHandlers({
  offer: handleOffer,
  answer: handleAnswer,
  candidate: handleCandidate,
  reconnect: handleReconnect,
});

// ┌────── Signaling Handlers ──────┐
async function handleOffer(sdp) {
  ensurePeerConnection();
  await peerConnection.setRemoteDescription({ type: "offer", sdp });

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  sendSignalingMessage({ type: "answer", sdp: answer.sdp });
}

async function handleAnswer(sdp) {
  await peerConnection.setRemoteDescription({ type: "answer", sdp });
}

async function handleCandidate(candidate) {
  await peerConnection.addIceCandidate(candidate);
}

async function handleReconnect() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  startWebRTC(currentRoomId);
}

// ┌────────── PeerConnection Setup ──────────┐
function ensurePeerConnection() {
  if (peerConnection) return peerConnection;

  peerConnection = new RTCPeerConnection();

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignalingMessage({ type: "candidate", candidate: event.candidate });
    }
  };

  // Additional event hooks optional
}

// ┌────────── Join Logic ──────────┐
function startWebRTC(roomId) {
  currentRoomId = roomId;
  ensurePeerConnection();
  initiateSignaling(roomId);
}
