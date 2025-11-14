const socket = io("https://chitzo-server.onrender.com");
const roomId = "testRoom";
socket.emit("join-room", roomId);

// ---------------- CHAT ----------------
const chatBox = document.getElementById("chat");
const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("send");

sendBtn.onclick = () => {
  const message = msgInput.value;
  if (!message) return;
  socket.emit("chat-message", { roomId, message });
  chatBox.value += `Me: ${message}\n`;
  msgInput.value = "";
};

socket.on("chat-message", ({ id, message }) => {
  chatBox.value += `Friend (${id.slice(0, 5)}): ${message}\n`;
});

// ---------------- CALL ----------------
let localStream;
let peerConnection;

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" } // Google's free STUN server
  ]
};

async function startCall() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("me").srcObject = localStream;

  peerConnection = new RTCPeerConnection(servers);
  peerConnection.ontrack = (event) => {
    document.getElementById("friend").srcObject = event.streams[0];
  };
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", { roomId, data: { type: "ice", candidate: event.candidate } });
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("signal", { roomId, data: { type: "offer", sdp: offer } });
}

socket.on("signal", async ({ from, data }) => {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = (event) => {
      document.getElementById("friend").srcObject = event.streams[0];
    };
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", { roomId, data: { type: "ice", candidate: event.candidate } });
      }
    };
  }

  if (data.type === "offer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("signal", { roomId, data: { type: "answer", sdp: answer } });
  } else if (data.type === "answer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
  } else if (data.type === "ice") {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

// Start call after 3 seconds (for demo)
setTimeout(startCall, 3000);
