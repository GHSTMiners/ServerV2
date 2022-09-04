import { Room, Client } from "colyseus.js";
import * as Protocol from "gotchiminer-multiplayer-protocol"

export function requestJoinOptions (this: Client, i: number) {
    let auth_msg : Protocol.AuthenticationInfo = new Protocol.AuthenticationInfo()
    auth_msg.chainId = Number(137).toString()
    auth_msg.gotchiId = 15090
    auth_msg.walletAddress = '0x3d93622B63F86e74f631AB77b867Fd52083a12Ef'
    auth_msg.password = 'test'
    return auth_msg;
}

export function onJoin(this: Room) {
    console.log(this.sessionId, "joined.");

    this.onMessage("*", (type, message) => {
        console.log(this.sessionId, "received:", type, message);
    });
}

export function onLeave(this: Room) {
    console.log(this.sessionId, "left.");
}

export function onError(this: Room, err: any) {
    console.log(this.sessionId, "!! ERROR !!", err.message);
}

export function onStateChange(this: Room, state: any) {
    console.log(this.sessionId, "new state:", state);
}
