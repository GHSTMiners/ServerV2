import http from 'http';
import axios from "axios"
import { Client, Presence } from "colyseus";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import AavegotchiInfoFetcher from '../AavegotchiInfoFetcher';
import { AuthenticationInfo } from 'gotchiminer-multiplayer-protocol';

export default class Authenticator {
    constructor(presence: Presence, options: Protocol.AuthenticationInfo) {
        this.m_options = options
        this.m_presence = presence
        this.m_failedReason = ""
    }

    public async authenticate() : Promise<AuthenticatorState> {
        let status : AuthenticatorState = await this.validateAuthenticationInfo()
        if(status != AuthenticatorState.AuthenticationFailed) {
            status = await this.validateWalletOwnership()
        }
        if(status != AuthenticatorState.AuthenticationFailed) {
            status = await this.validateWalletOwnership()
        }
        if(status != AuthenticatorState.AuthenticationFailed) {
            status = await this.validateGotchiOwnership()
        }
        if(status != AuthenticatorState.AuthenticationFailed) {
            status = await this.validateGotchiPresence()
        }
        if(status == AuthenticatorState.GotchiPresenceVerified) status = AuthenticatorState.Authenticated
        return status;
    }

    public failedReason() : string {
        return this.m_failedReason
    }

    public roles() {
        return this.m_roles
    }

    private async validateGotchiPresence() : Promise<AuthenticatorState> {
        if(!this.m_presence.get(`gotchi_${this.m_options.gotchiId.toString()}`)) {
            return AuthenticatorState.GotchiPresenceVerified
        } else {
            this.m_failedReason = "This Aavegotchi is already playing"
            return  AuthenticatorState.AuthenticationFailed
        }
    }

    private async validateGotchiOwnership() : Promise<AuthenticatorState> {
        let traitFetcher : AavegotchiInfoFetcher = new AavegotchiInfoFetcher()
        //Fetch owner for this gotchi
        let owner : string = await traitFetcher.getAavegotchiOwner(this.m_options.gotchiId)
        //Very that the wallet from the address is the same as the owner of the gotchi
        if(owner == this.m_options.walletAddress) {
            return AuthenticatorState.VerifiedGotchiOwnership
        } else {
            this.m_failedReason = "You are not the owner of this Aavegotchi"
            return AuthenticatorState.AuthenticationFailed
        }
    }

    private async validateWalletOwnership() : Promise<AuthenticatorState>{
        const response = await axios.post("https://chisel.gotchiminer.rocks/api/token/validate", { wallet_address: this.m_options.walletAddress, token: this.m_options.authenticationToken })
        //Check result status
        if (response.status == 200) {
            //Check that token is valid
            if(response.data.success) {
                this.m_roles = response.data.roles
                return AuthenticatorState.ValidatedWalletOwnership
            } else {
                this.m_failedReason = `Server rejected your authentication information`
                return AuthenticatorState.AuthenticationFailed
            }
        } else {
            this.m_failedReason = `Server request returned code: ${response.status}`
            return AuthenticatorState.AuthenticationFailed
        }
    }

    private async validateAuthenticationInfo() : Promise<AuthenticatorState> {
        //Verify wallet address
        if(this.m_options.walletAddress.match(/^0x[a-fA-F0-9]{40}$/g)) {
            //Verify GotchiID
            if(this.m_options.gotchiId >= 0) {
                //Check chain ID
                if ((this.m_options.chainId == "1") || (this.m_options.chainId == "137")) {
                    return AuthenticatorState.AuthenticationInfoVerified
                } else {
                    this.m_failedReason = "The chain you want to play on is not supported, only Polygon and Ethereum is supported"
                    return AuthenticatorState.AuthenticationFailed
                }
            } else {
                this.m_failedReason = "Aavegotchi ID is invalid"
                return AuthenticatorState.AuthenticationFailed
            }
        } else {
            this.m_failedReason = "Wallet address is malformed"
            return AuthenticatorState.AuthenticationFailed
        }
    }

    private m_roles : any
    private m_options : Protocol.AuthenticationInfo
    private m_presence : Presence
    private m_failedReason = ""
}

export enum AuthenticatorState{
    Start = "Start",
    AuthenticationInfoVerified = "AuthenticationInfoVerified",
    ValidatedWalletOwnership = "ValidatedWalletOwnership",
    VerifiedGotchiOwnership = "VerifiedGotchiOwnership",
    GotchiPresenceVerified = "GotchiPresenceVerified",
    AuthenticationFailed = "AuthenticationFailed",
    Authenticated = "Authenticated"
}