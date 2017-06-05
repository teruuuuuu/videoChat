var MyWebRtcSocket = Object.subClass({
  socketReady: false,
  sdp:'',
  ice:'',
  onOpened: function(evt) {
    console.log('socket opened.');
    this.socketReady = true;
  },
  onDiscoonected: function(evt){
    if (evt.type === 'user dissconnected' && isPeerStarted()) {
      console.log("disconnected");
      detachVideo(evt.from); // force detach video
      stopConnection(evt.from);
    };
  },
  onWalkIn: function(evt){
    if (evt.type === 'walkIn') {
      sendOffer(evt.from, this.sendSDP, this.sendCandidate);
    }
  },
  onCall: function(evt){
    var conn = getConnection(evt.from);
    if (evt.type === 'call') {
      if (! isLocalStreamStarted()) {
        return;
      }
      if (conn) {
        console.log("call")
        console.info(conn)
        return;
      }

      if (isConnectPossible()) {
        this.sendWalkIn(evt.from);
      }
      else {
        console.warn('max connections. so ignore call');
      }
      return;
    }
  },
  onSdp: function(evt){
    if (evt.type === 'offer') {
      console.log("Received offer, set offer, sending answer....")
      onOffer(evt, this.sendSDP, this.sendCandidate);
    } else if (evt.type === 'answer' && isPeerStarted()) {  // **
      console.log('Received answer, settinng answer SDP');
      onAnswer(evt);
    }
  },
  onCandidate: function(evt){
    if (evt.type === 'candidate' && isPeerStarted()) { // **
      console.log('Received ICE candidate...');
      onCandidate(evt);
    }
  },
  onPublish: function(msg){
    var domMsg = document.createElement('div');
    domMsg.innerHTML = new Date().toLocaleTimeString() + ' ' + msg.value;
    //msgArea.appendChild(domMsg);
    msgArea = document.getElementById("msg");
    msgArea.insertBefore(domMsg, msgArea.firstChild);
  },
  sendEnter: function(roomname, userName){
    socket.connect();
    setTimeout(function (){socket.emit('enter', roomname, userName)}, 3000);
    setTimeout(function (){socketController.sendCall()}, 3000);
  },
  sendWalkIn: function(id) {
    socket.emit('walkIn', {type: "walkIn", sendto: id });
  },
  sendCall: function(id) {
    socket.emit('call', {type: "call", sendto: id });
  },
  sendSDP: function(sdp) {
    this.sdp = sdp;
    console.log("---sending sdp ---");
    console.info(sdp);
    socket.emit('sdp', {'type': sdp.type, 'sdp': sdp.sdp, 'sendto': sdp.sendto});
  },
  sendCandidate: function(candidate) {
    this.ice = candidate;
    console.log("---sending candidate  ---");
    console.info(candidate);
    socket.emit('candidate', candidate);
  },
  sendCall: function() {
    if (! isLocalStreamStarted()) {
      alert("Local stream not running yet. Please [Start Video] or [Start Screen].");
      return;
    }
    if (! this.socketReady) {
      alert("Socket is not connected to server. Please reload and try again.");
      return;
    }
    // call others, in same room
    console.log("call others in same room, befeore offer");
    //socket.json.send({type: "call"});
    socket.emit('call', {type: "call" });
  },
  hangUp: function() {
    console.log("Hang up.");
    detachAllVideo();
    stopAllConnections();
  },
  publishMessage: function(room, text){
    socket.emit("publish", room, text);
  },
  leaveRoom: function(room, text){
    stopVideo();
    this.hangUp();
    socket.disconnect();
  }
});

var socketController =  new MyWebRtcSocket();
var socket = io.connect('/');
function onOpenedSock(evt){
  socketController.onOpened(evt);
}
function onDisconnectedSock(evt){
  socketController.onDiscoonected(evt);
}
function onMessageSock(evt){
  socketController.onMessage(evt);
}
function onWalkInSock(evt){
  socketController.onWalkIn(evt);
}
function onCallSock(evt){
  socketController.onCall(evt);
}
function onSdpSock(evt){
  socketController.onSdp(evt);
}
function onCandidateSock(evt){
  socketController.onCandidate(evt);
}
function onPublishSock(msg){
  socketController.onPublish(msg);
}
socket.on('connect', onOpenedSock)
      .on('disconnected', onDisconnectedSock)
      .on('walkIn', onWalkInSock)
      .on('call', onCallSock)
      .on('sdp', onSdpSock)
      .on('publish', onPublishSock)
      .on('candidate', onCandidateSock);
