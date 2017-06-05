var port = 8888;
//var io = require('socket.io').listen(port);
var fs = require("fs");

var ssl_key = 'localhost.key';
var ssl_crt = 'localhost.crt';
var options = {  key: fs.readFileSync(ssl_key), cert: fs.readFileSync(ssl_crt) };

var server = require("https").createServer( options, function(req, res){
  console.log("request:" + req.url);
  res.writeHead(200, {"Content-Type":"text/html"});

  var output = "";
  try {
    fs.statSync("." + req.url);
    console.log("file found")
    output = fs.readFileSync("." + req.url, "utf-8");
  } catch (e) {
    console.log("no file");
  }
  res.end(output);
}).listen(port);

var io = require("socket.io").listen(server);
console.log((new Date()) + " Server is listening on port " + port);
var roomData = {};

var RoomManager = require('./server/Room/RoomManager.js');
var roomManager = new RoomManager();

io.sockets.on('connection', function(socket) {
  // 入室
  socket.on('enter', function(roomname, userName) {
    console.log("enter");
    roomManager.walkIn(roomname, socket.id, userName);
    io.sockets.to(roomManager.userRoomHash[socket.id]).emit("publish", {
          value: userName + "がroom" + roomname + "に入室しました"
    });
    socket.join(roomname);
    io.sockets.to(socket.id).emit("publish", {
                              value:"あなたは" + roomname + "に入室しました。",
                              });

  });

  socket.on('walkIn', function(message) {
    console.log("walkin");
    console.info(message);
    message.from = socket.id;

    var target = roomManager.userRoomHash[socket.id];
    if (target) {
      socket.broadcast.to(target).emit('walkIn', message);
      return;
    }
  });

  socket.on('call', function(message) {
    console.log("call");
    console.info(message);
    message.from = socket.id;

    console.info(roomManager.userRoomHash);
    console.info(socket.id);
    var target = roomManager.userRoomHash[socket.id];
    if (target) {
      socket.broadcast.to(target).emit('call', message);
      return;
    }
  });

  socket.on('sdp', function(sdp) {
    console.log("sdp");
    console.info(sdp);
    sdp.from = socket.id;
    var target = sdp.sendto;
    if (target) {
      io.sockets.to(target).emit('sdp', sdp);
      return;
    }
  });

  socket.on('candidate', function(candidate) {
    console.log("candidate");
    console.info(candidate);
    // 送信元のidをメッセージに追加（相手が分かるように）
    candidate.from = socket.id;
    var target = candidate.sendto;
    if (target) {
      io.sockets.to(target).emit('candidate', candidate);
      return;
    }
  });

  socket.on("publish", function(roomName, msg){
    console.log("publish msg:" + msg + "; socketId:" + socket.id);
    console.log("userRoomHash:" + roomManager.userRoomHash[socket.id]);
    //if(roomManager.isRoomMember(roomName, socket.id)){
        io.sockets.to(roomManager.userRoomHash[socket.id]).emit(
            "publish", {value:roomManager.getUserName(roomName, socket.id) + ":" +  msg});
    //}
  });

  socket.on('disconnect', function() {
    var roomname = roomManager.userRoomHash[socket.id];
    var userName = roomManager.getUserName(roomname, socket.id);
    io.sockets.to(roomname).emit("publish", {
          value: userName + "がroom" + roomname + "を退室しました"
    });
    roomManager.walkOff(socket.id);
    io.sockets.to(roomname).emit('disconnected', {type: 'user dissconnected'});
  });

});
