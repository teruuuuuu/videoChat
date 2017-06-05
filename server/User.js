module.exports = function(socketId, userName) {
    //this.socket = socket;
    this.socketId = socketId;
    this.name = userName;
    this.sdp = '';
    this.ice = '';

    this.isMe = function(socketId){
        if(this.socketId == socketId){
            return true;
        }
        return false;
    };

    this.setSdpIce = function(sdp, ice){
        this.sdp = sdp;
        this.ice = ice;
    };
};
