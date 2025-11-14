// const socket = io("https://chitzo-server.onrender.com");

// // =================== UI ===================
// const chatBox = document.getElementById("chat");
// const msgInput = document.getElementById("msg");
// const sendBtn = document.getElementById("send");

// // ================= MATCH MAKING =================
// socket.on("waiting", (msg) => {
//   console.log(msg);
//   chatBox.value += "[ Waiting for a partner... ]\n";
// });

// socket.on("paired", (partnerId) => {
//   console.log("Paired with:", partnerId);
//   chatBox.value += `[ Connected to: ${partnerId.slice(0, 5)} ]\n`;
//   startCall();
// });

// // ====================== CHAT ======================
// sendBtn.onclick = () => {
//   const message = msgInput.value;
//   if (!message) return;

//   chatBox.value += `Me: ${message}\n`;
//   msgInput.value = "";

//   socket.emit("signal", {
//     type: "chat",
//     message
//   });
// };

// socket.on("signal", ({ from, data }) => {
//   if (data.type === "chat") {
//     chatBox.value += `Friend (${from.slice(0, 5)}): ${data.message}\n`;
//   }
// });

// // ====================== CALL ======================
// let localStream;
// let peerConnection;

// const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// async function startCall() {
//   localStream = await navigator.mediaDevices.getUserMedia({
//     video: true,
//     audio: true
//   });
//   document.getElementById("me").srcObject = localStream;

//   peerConnection = new RTCPeerConnection(servers);

//   peerConnection.ontrack = (event) => {
//     document.getElementById("friend").srcObject = event.streams[0];
//   };

//   localStream.getTracks().forEach((track) =>
//     peerConnection.addTrack(track, localStream)
//   );

//   peerConnection.onicecandidate = (event) => {
//     if (event.candidate) {
//       socket.emit("signal", {
//         type: "ice",
//         candidate: event.candidate
//       });
//     }
//   };

//   const offer = await peerConnection.createOffer();
//   await peerConnection.setLocalDescription(offer);

//   socket.emit("signal", { type: "offer", sdp: offer });
// }

// socket.on("signal", async ({ from, data }) => {
//   if (!peerConnection) {
//     peerConnection = new RTCPeerConnection(servers);

//     localStream.getTracks().forEach((track) =>
//       peerConnection.addTrack(track, localStream)
//     );

//     peerConnection.ontrack = (event) => {
//       document.getElementById("friend").srcObject = event.streams[0];
//     };

//     peerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("signal", {
//           type: "ice",
//           candidate: event.candidate
//         });
//       }
//     };
//   }

//   if (data.type === "offer") {
//     await peerConnection.setRemoteDescription(
//       new RTCSessionDescription(data.sdp)
//     );
//     const answer = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answer);

//     socket.emit("signal", { type: "answer", sdp: answer });
//   }

//   if (data.type === "answer") {
//     await peerConnection.setRemoteDescription(
//       new RTCSessionDescription(data.sdp)
//     );
//   }

//   if (data.type === "ice") {
//     await peerConnection.addIceCandidate(
//       new RTCIceCandidate(data.candidate)
//     );
//   }
// });

// // ===================== PARTNER LEFT ======================
// socket.on("partner-left", () => {
//   chatBox.value += "[ Partner disconnected ]\n";
//   if (peerConnection) peerConnection.close();
//   peerConnection = null;
// });

const socket = io("https://chitzo-server.onrender.com"); // change to your deployed server if needed

// UI
const chatBox = document.getElementById("chat");
const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("send");

// ========== Match Making ==========
socket.on("waiting", (msg) => {
  chatBox.value += "[ Waiting for a partner... ]\n";
});

socket.on("paired", (partnerId) => {
  chatBox.value += `[ Connected to: ${partnerId.slice(0, 5)} ]\n`;
  startCall();
});

// ========== Chat ==========
sendBtn.onclick = () => {
  const message = msgInput.value;
  if (!message) return;

  chatBox.value += `Me: ${message}\n`;
  msgInput.value = "";

  socket.emit("signal", {
    type: "chat",
    message
  });
};

socket.on("signal", ({ from, data }) => {
  if (data.type === "chat") {
    chatBox.value += `Friend (${from.slice(0, 5)}): ${data.message}\n`;
  }
});

// ========== Call ==========
let localStream;
let peerConnection;
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

async function startCall() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("me").srcObject = localStream;

  peerConnection = new RTCPeerConnection(servers);

  peerConnection.ontrack = (event) => {
    document.getElementById("friend").srcObject = event.streams[0];
  };

  localStream.getTracks().forEach((track) =>
    peerConnection.addTrack(track, localStream)
  );

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", { type: "ice", candidate: event.candidate });
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("signal", { type: "offer", sdp: offer });
}

socket.on("signal", async ({ from, data }) => {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection(servers);

    localStream.getTracks().forEach((track) =>
      peerConnection.addTrack(track, localStream)
    );

    peerConnection.ontrack = (event) => {
      document.getElementById("friend").srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", { type: "ice", candidate: event.candidate });
      }
    };
  }

  if (data.type === "offer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("signal", { type: "answer", sdp: answer });
  } else if (data.type === "answer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
  } else if (data.type === "ice") {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

// ========== Skip Button ==========
document.getElementById("skipBtn").onclick = () => {
  chatBox.value += "[ You skipped the user ]\n";

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }

  socket.emit("skip");
};

// ========== Partner Left ==========
socket.on("partner-left", () => {
  chatBox.value += "[ Partner disconnected ]\n";

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }

  chatBox.value += "[ Searching for a new partner... ]\n";
});

