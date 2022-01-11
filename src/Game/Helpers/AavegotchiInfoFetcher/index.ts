import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils/types'
import diamondABI from '../../../../contracts/aavegotchiFacet.json';

export class AavegotchiTraits {
    constructor(traits : number[]) {
        this.traits = traits
        this.energy = traits[0]
        this.aggression = traits[1]
        this.spookiness = traits[2]
        this.brain_size = traits[3]
        this.eye_shape = traits[4]
        this.eye_color = traits[5]
    }

    readonly energy : number
    readonly aggression : number
    readonly spookiness : number
    readonly brain_size : number
    readonly eye_shape : number
    readonly eye_color : number
    readonly traits : number[]
}

export default class AavegotchiInfoFetcher {

    constructor() {
        //Initialize web3 using polygon rpc
        this.web3 = new Web3("https://polygon-rpc.com/")
        //Load our smart contract
        const diamondAddress = '0x86935F11C86623deC8a25696E1C19a8659CbF95d';
        this.aavegotchiFacet = new this.web3.eth.Contract(diamondABI as AbiItem[], diamondAddress);
    }

    public async getAavegotchiOwner(gotchiID : number) : Promise<string> {
        return await this.aavegotchiFacet.methods.ownerOf(gotchiID).call()
    }

    public async getAavegotchiTraits(gotchiID : number) : Promise<AavegotchiTraits> {
        let result : any = await this.aavegotchiFacet.methods.modifiedTraitsAndRarityScore(gotchiID).call()
        let traits : AavegotchiTraits = new AavegotchiTraits(result.numericTraits_)
        return traits
    }


    private web3 : Web3
    private aavegotchiFacet : Contract 


}