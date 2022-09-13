
export default class WebRTCConnection {
    constructor(token : string) {
        this.DefaultRTCPeerConnection.createDataChannel('ping-pong');
        
    }

    private DefaultRTCPeerConnection = require('wrtc').RTCPeerConnection;
}