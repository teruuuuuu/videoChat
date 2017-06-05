module.exports = function(roomNo, controller) {
    console.log("cal room");
    this.roomNo = roomNo;
    this.controller = controller;
    this.users = {};

    this.init = function(){
        console.log("room init");
    };

    this.walkIn = function(user){
        console.log("walkin ");
        console.info(user);
        this.users[user.socketId] = user;
    };

    this.walkOff = function(socketId){
        var user = this.getUser(socketId);
        if(user != null){
            var ret = user.name + "が退席しました";
            console.log(ret);
            delete this.users[socketId]
            return ret;
        }else{
            console.log("socketId:" +socketId+"ユーザー取得失敗")
            return '';
        }
    };

    this.isHere = function(roomNo){
        if(this.roomNo = roomNo){ return true; }
        return false;
    };

    this.isRoomMember = function(socketId){
        if(this.users[socketId]){
            return true;
        }
        return false;
    };

    this.getUser = function(socketId){
        if(this.users[socketId]){
            return this.users[socketId];
        }
        return null;
    };

    this.userName = function(socketId){
        if(this.users[socketId]){
            return this.users[socketId].name;
        }
        return '';
    };

    this.userTeam = function(socketId){
        if(this.users[socketId]){
            return this.users[socketId].team;
        }
        return '';
    };

    this.sendSdpIce = function(socketId, sdp, ice){
        var user = this.getUser(socketId);
        console.log("def sendSdpIce user:" + user.name + "; sdp " + sdp + "; ice:" + ice);
        user.setSdpIce(sdp, ice);
    }
    this.init();
};
