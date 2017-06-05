var Room = require('./Room.js');
var User = require('../User.js');


module.exports = function() {

    this.userRoomHash = {}; //socketIDと部屋番号の組み合わせ
    this.rooms = {};

    this.walkIn = function(roomName, socketId, userName) {
        console.log("walkin" + roomName);
        var user = new User(socketId, userName);

        this.userRoomHash[socketId] = roomName;
        if(this.rooms[roomName] === undefined){
          var room = new Room(roomName);
          this.rooms[roomName] = room;
        }
        this.rooms[roomName].walkIn(user);
        console.log("walk in userRoomHash:" + this.userRoomHash[socketId]);
    };

    this.walkOff = function( socketId){
        if(this.userRoomHash[socketId]){
          var roomNo = this.userRoomHash[socketId];
          if(this.rooms[roomNo] == null){
              return {result:0, msg:"部屋なし"};
          }else{
              delete this.userRoomHash[socketId];
              return {result:1, msg:this.rooms[roomNo].walkOff(socketId), roomNo: roomNo};
          }
        }
        return {result:0, msg:"該当ユーザーなし"};
    };

    this.deleteRoom = function(roomNo){
        delete this.rooms[roomNo];
        //ToDO userRoomHashも消す
    }

    this.selectPosi = function(socketId, selectPosi){
        console.log("sockeId:" + socketId);
        console.log("roomNo:" + this.userRoomHash[socketId]);
        this.rooms[this.userRoomHash[socketId]].selectPosi(socketId, selectPosi);
    }

    this.isRoomMember = function(roomNo, socketId) {
        if(!(this.rooms[roomNo] === undefined)) {
            return this.rooms[roomNo].isRoomMember(socketId);
        }
        return false;
    };

    this.getUserName = function(roomNo, socketId){
        if(!(this.rooms[roomNo] === undefined)) {
            return this.rooms[roomNo].userName(socketId);
        }
        return false;
    };

    this.sendSdpIce = function(socketId, sdp, ice){
        var roomNo = this.userRoomHash[socketId];
        if(roomNo){
            this.rooms[roomNo].sendSdpIce(socketId, sdp, ice);
        }
    };

    this.getSdpIce = function(socketId, team){
        var roomNo = this.userRoomHash[socketId];

        if(!roomNo){
            return {sdp:'', ice:''};
        }

        var user = null;
        if(team == 1){
            user = this.rooms[roomNo].black;
        }else if (team == 2){
            user = this.rooms[roomNo].white;
        }
        console.log("sockeId=" + socketId + " team=" + team + "roomNo=" + roomNo);
        if(!user){
            return {sdp:'', ice:''};
        }
        console.log("sdp :" + user.sdp + " ice:" + user.ice);
        return {sdp:user.sdp, ice:user.ice};
    };

    this.getUserTeam = function(socketId){
        var roomNo = this.userRoomHash[socketId];
        if(!roomNo){
            return 0;
        }
        return this.rooms[roomNo].userTeam(socketId);
    };
};
