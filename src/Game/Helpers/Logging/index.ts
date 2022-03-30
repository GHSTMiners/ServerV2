import axios from "axios"
import Config from "../../../Config"

export default class Logging {
    public static submitEvent(event : string, score : number, ipAddress : string, gotchi : number | undefined, wallet : string | undefined, chainId : number | undefined = 137) {
        axios.post(`${Config.apiURL}/logging`, { event: event, score: score, ip_address: ipAddress, gotchi: gotchi, wallet: wallet, chain_id: chainId }, {
            headers: {
                'X-API-KEY': Config.apiKey
            }
        }).catch(exception=> {
            console.warn(exception);
        })
    }
}