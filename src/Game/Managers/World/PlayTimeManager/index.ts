import * as Protocol from "gotchiminer-multiplayer-protocol"
import PlayerManager from "../PlayerManager";
import Player from "../../../Objects/Player";
import ChatManager from "../ChatManager";
import Config from "../../../../Config";

export default class PlayTimeManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, playerManager : PlayerManager) {
        super(scene, "PlayerTimeManager")
        this.m_gameStartTime = new Date(Date.now());
        this.m_gameEndTime = new Date(Date.now() + Config.gameDuration * 1000)
        this.m_playerStartTimes = new Map<Player, Date>()
        playerManager.on(PlayerManager.PLAYER_ADDED, this.handlePlayerJoined.bind(this))
        playerManager.on(PlayerManager.PLAYER_REMOVED, this.handlePlayerLeave.bind(this))
        console.log(this.m_gameEndTime.getTime() - this.m_gameStartTime.getTime());
        
    }

    private handlePlayerJoined(player : Player) {
        this.m_playerStartTimes.set(player, new Date(Date.now()))
    }

    private handlePlayerLeave(player : Player) {
        this.m_playerStartTimes.delete(player);
    }

    public playerPlayTime(player : Player) {
        let playTime : Date | undefined = this.m_playerStartTimes.get(player)
        if(playTime) {
            return playTime
        } else return 0
    }

    public gameStartTime() : Date {
        return this.m_gameStartTime
    }

    public gameEndTime() : Date {
        return this.m_gameEndTime
    }

    private m_gameStartTime : Date;
    private m_gameEndTime : Date;
    private m_playerStartTimes : Map<Player, Date>
}