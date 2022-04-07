import axios from "axios"
import Config from "../../../Config"
import http from 'http';

export default class Logging {
    public static submitEvent(event : string, score : number, request: http.IncomingMessage, gotchi : number | undefined, wallet : string | undefined, chainId : number | undefined = 137) {
        axios.post(`${Config.apiURL}/logging`, { event: event, score: score, ip_address: request.headers['cf-connecting-ip'] as string || request.socket ? request.socket.remoteAddress : "0.0.0.0", gotchi: gotchi, wallet: wallet, chain_id: chainId }, {
            headers: {
                'X-API-KEY': Config.apiKey
            }
        }).catch(exception=> {
            console.warn(exception);
        })
    }
}