var turn_server_url = "turnサーバのurl";
var turn_server_user = "turnサーバのユーザ";
var turn_server_credential = "turnサーバユーザのパスワード";

function getVideoForRemote(index) {
  var elementID = 'webrtc-remote-video-' + index;
  var element = document.getElementById(elementID);
  return element;
}

function createVideoElement(id){
  var videoElement = document.createElement("video");
  videoElement.id = "webrtc-remote-video-" + id;
  videoElement.autoplay = true;
  videoElement.style.width = "240px";
  videoElement.style.height = "180";
  videoElement.style.border = "1px solid black";
  videoElement.style.display = "inline";
  var videoArea = document.getElementById("videoArea");
  videoArea.appendChild(videoElement);
  return videoElement;
}

function pushVideoInUse(id, element) {
  videoElementsInUse[id] = element;
}

function popVideoInUse(id) {
  element = videoElementsInUse[id];
  delete videoElementsInUse[id];
  return element;
}

function attachVideo(id, stream) {
  console.log('try to attach video. id=' + id);
  var videoElement = createVideoElement(id);
  if (videoElement) {
    videoElement.src = window.URL.createObjectURL(stream);
    console.log("videoElement.src=" + videoElement.src);
    pushVideoInUse(id, videoElement);
  }
  else {
    console.error('--- no video element stand by.');
  }
}

function detachVideo(id) {
  console.log('try to detach video. id=' + id);
  var videoElement = popVideoInUse(id);
  if (videoElement) {
    videoElement.pause();
    videoElement.src = "";
    console.log("videoElement.src=" + videoElement.src);
    //pushVideoStandBy(videoElement);
  }
  else {
    console.warn('warning --- no video element using with id=' + id);
  }
}

function detachAllVideo() {
  var element = null;
  for (var id in videoElementsInUse) {
    detachVideo(id);
  }
}

function getFirstVideoInUse() {
  var element = null;
  for (var id in videoElementsInUse) {
    element = videoElementsInUse[id];
    return element;
  }
  return null;
}

function getVideoCountInUse() {
  var count = 0;
  for (var id in videoElementsInUse) {
    count++;
  }
  return count;
}


function isLocalStreamStarted() {
  if (localStream) {
    return true;
  }
  else {
    return false;
  }
}

// -------------- multi connections --------------------
var MAX_CONNECTION_COUNT = 10;
var connections = {}; // Connection hash
function Connection() { // Connection Class
  var self = this;
  var id = "";  // socket.id of partner
  var peerconnection = null; // RTCPeerConnection instance
  var established = false; // is Already Established
  var iceReady = false;
}

function getConnection(id) {
  var con = null;
  con = connections[id];
  return con;
}

function addConnection(id, connection) {
  connections[id] = connection;
}

function getConnectionCount() {
  var count = 0;
  for (var id in connections) {
    count++;
  }

  console.log('getConnectionCount=' + count);
  return count;
}

function isConnectPossible() {
  if (getConnectionCount() < MAX_CONNECTION_COUNT)
    return true;
  else
    return false;
}

function getConnectionIndex(id_to_lookup) {
  var index = 0;
  for (var id in connections) {
    if (id == id_to_lookup) {
      return index;
    }

    index++;
  }

  // not found
  return -1;
}

function deleteConnection(id) {
  delete connections[id];
}

function stopAllConnections() {
  for (var id in connections) {
    var conn = connections[id];
    conn.peerconnection.close();
    conn.peerconnection = null;
    delete connections[id];
  }
}

function stopConnection(id) {
  var conn = connections[id];
  if(conn) {
    console.log('stop and delete connection with id=' + id);
    conn.peerconnection.close();
    conn.peerconnection = null;
    delete connections[id];
  }
  else {
    console.log('try to stop connection, but not found id=' + id);
  }
}

function isPeerStarted() {
  if (getConnectionCount() > 0) {
    return true;
  }
  else {
    return false;
  }
}

function onOffer(evt, sendSDP, sendCandidate) {
  console.log("Received offer...")
  console.log(evt);
  setOffer(evt, sendCandidate);
  sendAnswer(evt, sendSDP);
//peerStarted = true; --
}

function onAnswer(evt) {
  console.log("Received Answer...")
  console.log(evt);
  setAnswer(evt);
}

function onCandidate(evt) {
var id = evt.from;
  var conn = getConnection(id);
  if (! conn) {
  console.error('peerConnection not exist!');
  return;
}

  if (! conn.iceReady) {
    console.warn("PeerConn is not ICE ready, so ignore");
    return;
  }

  var candidate = new RTCIceCandidate({sdpMLineIndex:evt.sdpMLineIndex, sdpMid:evt.sdpMid, candidate:evt.candidate});
  console.log("Received Candidate...")
console.log(candidate);
  conn.peerconnection.addIceCandidate(candidate);
}


function startVideo() {
  //navigator.webkitGetUserMedia({video: true, audio: true},
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia;
  navigator.getUserMedia({video: true, audio: false},
     function (stream) { // success
      localStream = stream;
      window.URL = window.URL || window.webkitURL;
      localVideo.src = window.URL.createObjectURL(stream);
      localVideo.play();
    localVideo.volume = 0;
     },
     function (error) { // error
      console.error('An error occurred:');
      console.error(error);
      return;
     }
  );
}

function stopVideo() {
  localVideo.src = "";
  localStream = null;
  //localStream.stop();

}

// ---------------------- connection handling -----------------------
function prepareNewConnection(id, sendCandidate) {
  var pc_config = {"iceServers":[{"url": "stun:" + turn_server_url},
       {"url": "turn:" + turn_server_url, "username":turn_server_user, "credential":turn_server_credential}
  ]};
  var peer = null;
  try {
    var peerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection ||
                       window.webkitRTCPeerConnection || window.msRTCPeerConnection;
    peer = new peerConnection(pc_config);
  } catch (e) {
    console.log("Failed to create PeerConnection, exception: " + e.message);
  }
  var conn = new Connection();
  conn.id = id;
  conn.peerconnection = peer;
  peer.id = id;
  addConnection(id, conn);

  // send any ice candidates to the other peer
  peer.onicecandidate = function (evt) {
    if (evt.candidate) {
      console.log(evt.candidate);
      sendCandidate({type: "candidate",
                        sendto: conn.id,
                        sdpMLineIndex: evt.candidate.sdpMLineIndex,
                        sdpMid: evt.candidate.sdpMid,
                        candidate: evt.candidate.candidate});
    } else {
      console.log("End of candidates. ------------------- phase=" + evt.eventPhase);
      conn.established = true;
    }
  };

  console.log('Adding local stream...');
  peer.addStream(localStream);

  peer.addEventListener("addstream", onRemoteStreamAdded, false);
  peer.addEventListener("removestream", onRemoteStreamRemoved, false)

  // when remote adds a stream, hand it on to the local video element
  function onRemoteStreamAdded(event) {
    console.log("Added remote stream");
    attachVideo(this.id, event.stream);
  //remoteVideo.src = window.webkitURL.createObjectURL(event.stream);
  }

  // when remote removes a stream, remove it from the local video element
  function onRemoteStreamRemoved(event) {
    console.log("Remove remote stream");
    detachVideo(this.id);
  //remoteVideo.pause();
    //remoteVideo.src = "";
  }

  return conn;
}

function sendOffer(id, sendSDP, sendCandidate) {
  var conn = getConnection(id);
  if (!conn) {
    conn = prepareNewConnection(id, sendCandidate);
  }

  conn.peerconnection.createOffer(function (sessionDescription) { // in case of success
    conn.iceReady = true;
    conn.peerconnection.setLocalDescription(sessionDescription);
    sessionDescription.sendto = id;
    sendSDP(sessionDescription);
    }, function () { // in case of error
      console.log("Create Offer failed");
    }, mediaConstraints);
  conn.iceReady = true;
}

function setOffer(evt, sendCandidate) {
  var id = evt.from;
  var conn = getConnection(id);
  if (! conn) {
    conn = prepareNewConnection(id, sendCandidate);
    conn.peerconnection.setRemoteDescription(new RTCSessionDescription(evt));
  }
  else {
    console.error('peerConnection alreay exist!');
  }
}

function sendAnswer(evt, sendSDP) {
  console.log('sending Answer. Creating remote session description...' );
  var id = evt.from;
  var conn = getConnection(id);
  if (! conn) {
    console.error('peerConnection not exist!');
    return
  }

  conn.peerconnection.createAnswer(function (sessionDescription) {
    // in case of success
    conn.iceReady = true;
    conn.peerconnection.setLocalDescription(sessionDescription);
    sessionDescription.sendto = id;
    sendSDP(sessionDescription);
  }, function () { // in case of error
    console.log("Create Answer failed");
  }, mediaConstraints);
  conn.iceReady = true;
}

function setAnswer(evt) {
  var id = evt.from;
  var conn = getConnection(id);
  if (! conn) {
    console.error('peerConnection not exist!');
    return
  }
  conn.peerconnection.setRemoteDescription(new RTCSessionDescription(evt));
}
