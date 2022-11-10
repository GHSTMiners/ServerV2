import http from 'http';
import needle from "needle"
import { Client, Presence } from "colyseus";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import AavegotchiInfoFetcher from '../AavegotchiInfoFetcher';
import Config from '../../Config';
import Logging from '../Logging';

export default class Authenticator {
    constructor(presence: Presence, options: Protocol.AuthenticationInfo, request : http.IncomingMessage) {
        this.m_options = options
        this.m_presence = presence
        this.m_request = request
        this.m_failedReason = ""
    }

    public async authenticate_full() : Promise<AuthenticatorState> {
        if(process.env.SKIP_VALIDATION) {
            this.m_roles = {developer: true}
            return AuthenticatorState.Authenticated
        }
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
	const value = await this.m_presence.get(`gotchi_${this.m_options.gotchiId.toString()}`)
        if(!value) {
            return AuthenticatorState.GotchiPresenceVerified
        } else {
            Logging.submitEvent("Player tried to play with a Gotchi that already has a session", 1, this.m_request, this.m_options.gotchiId, this.m_options.walletAddress);
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
            Logging.submitEvent("Player tried to play with a Gotchi that it doesn't own", 100, this.m_request, this.m_options.gotchiId, this.m_options.walletAddress);
            this.m_failedReason = "You are not the owner of this Aavegotchi"
            return AuthenticatorState.AuthenticationFailed
        }
    }

    private async validateWalletOwnership() : Promise<AuthenticatorState>{
        const response = await needle('post', `${Config.apiURL}/token/validate`, { wallet_address: this.m_options.walletAddress, token: this.m_options.authenticationToken })
        //Check result status
        if (response.statusCode == 200) {
            //Check that token is valid
            if(response.body.success) {
                this.m_roles = response.body.roles
                return AuthenticatorState.ValidatedWalletOwnership
            } else {
                Logging.submitEvent("Player tried to authenticate with an invalid wallet authentication token", 10, this.m_request, this.m_options.gotchiId, this.m_options.walletAddress);
                this.m_failedReason = `Server rejected your authentication information`
                return AuthenticatorState.AuthenticationFailed
            }
        } else {
            this.m_failedReason = `Server request returned code: ${response.statusCode}`
            return AuthenticatorState.AuthenticationFailed
        }
    }

    private async validateAuthenticationInfo() : Promise<AuthenticatorState> {
        //Check if all fields are filled
        if(this.m_options.walletAddress && this.m_options.chainId && this.m_options.gotchiId && this.m_options.authenticationToken) {
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
                Logging.submitEvent("Player tried to authenticate with an malformed wallet address", 100, this.m_request, this.m_options.gotchiId, this.m_options.walletAddress,);
                this.m_failedReason = "Wallet address is malformed"
                return AuthenticatorState.AuthenticationFailed
            }
        } else {
            Logging.submitEvent("Player tried to authenticate malformed authentication data", 100, this.m_request, this.m_options.gotchiId, this.m_options.walletAddress);
            this.m_failedReason = "Authentication request is missing data"
            return AuthenticatorState.AuthenticationFailed
        }
    }

    private m_roles : any
    private m_request: http.IncomingMessage
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
