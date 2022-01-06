import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils/types'
import diamondABI from '../../../../contracts/aavegotchiFacet.json';

interface AavegotchiTraits {
    energy : number,
    aggression : number,
    spookiness : number,
    brain_size : number,
    eye_shape : number,
    eye_color : number
}

export default class AavegotchiTraitFetcher {

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
        return await this.aavegotchiFacet.methods.modifiedTraitsAndRarityScore(gotchiID).call()
    }


    private web3 : Web3
    private aavegotchiFacet : Contract 


}