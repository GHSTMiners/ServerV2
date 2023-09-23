import ClientWrapper from "../../Helpers/ClientWrapper";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import * as Schema from "../../Schemas";

export default class PlayerSeat {
    constructor(client : ClientWrapper, seatState : Schema.PlayerSeatState) {
        this.m_clientWrapper = client
        this.m_ready = false
        this.m_mapvote = -1
        this.m_selectedGotchi = -1
        this.m_seatState = seatState
        this.m_clientWrapper.messageRouter.addRoute(Protocol.ChangeMapVote, this.handleChangeMapVote.bind(this))
        this.m_clientWrapper.messageRouter.addRoute(Protocol.ChangePlayerReady, this.handleChangePlayerReady.bind(this))
        this.m_clientWrapper.messageRouter.addRoute(Protocol.ChangeSelectedGotchi, this.handleChangeSelectedGotchi.bind(this))
    }

    private handleChangeMapVote(message: Protocol.ChangeMapVote) {
        this.m_mapvote = message.worldId
        this.updateSchema()
    }

    private handleChangePlayerReady(message : Protocol.ChangePlayerReady) {
        this.m_ready = message.ready
        this.updateSchema()
    }

    private handleChangeSelectedGotchi(message: Protocol.ChangeSelectedGotchi) {
        this.m_selectedGotchi = message.gotchiId
        this.updateSchema()
    }

    private updateSchema() {
        this.m_seatState.gotchi_id = this.selectedGotchi()
        this.m_seatState.map_vote = this.mapVote()
        this.m_seatState.ready = this.ready()
    }

    public ready() : boolean {
        return this.m_ready
    }

    public mapVote() : number {
        return this.m_mapvote
    }

    public selectedGotchi() : number {
        return this.m_selectedGotchi
    }

    private m_ready : boolean
    private m_mapvote : number
    private m_seatState : Schema.PlayerSeatState
    private m_selectedGotchi : number
    private m_clientWrapper : ClientWrapper
}