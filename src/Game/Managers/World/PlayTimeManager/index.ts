import * as Protocol from "gotchiminer-multiplayer-protocol"
import PlayerManager from "../PlayerManager";
import Player from "../../../Objects/Player";
import ChatManager from "../ChatManager";
import Config from "../../../../Config";
import e from "express";
import MainScene from "../../../Scenes/MainScene";

export default class PlayTimeManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene, playerManager : PlayerManager) {
        super(scene, "PlayerTimeManager")
        this.m_gameStartTime = new Date();
        this.m_gameEndTime = new Date()
        this.m_mainScene = scene
        this.m_playerStartTimes = new Map<Player, Date>()
        playerManager.on(PlayerManager.PLAYER_ADDED, this.handlePlayerJoined.bind(this))
        playerManager.on(PlayerManager.PLAYER_REMOVED, this.handlePlayerLeave.bind(this)) 

        //Start game commence timer
        var env = process.env.NODE_ENV || 'production';
        if(env == "production") {
            this.startGame()
            this.m_mainScene.room.state.gameStartUTC = (new Date(Date.now())).getUTCDate()
        } else {
            this.m_mainScene.room.state.gameStartUTC = (new Date(Date.now() + 30 * 1000)).getUTCDate()
            scene.chatManager.broadCastMessage("Game will start in 30 seconds")
            setTimeout(this.startGame.bind(this), 1000 * 30)
        }
    }

    private startGame() {
        this.m_mainScene.chatManager.broadCastMessage(`The game has started, you have ${Config.gameDuration/60} minutes`)
        this.m_mainScene.room.state.ready = true
        let gameDurationMs : number = Config.gameDuration * 1000
        this.m_gameStartTime = new Date(Date.now());
        this.m_gameEndTime = new Date(Date.now() + gameDurationMs)
        this.m_mainScene.room.state.gameEndUTC = (new Date(this.m_gameEndTime)).getUTCDate()
        this.emit(PlayTimeManager.GAME_STARTED)
        setTimeout(this.endGame.bind(this), gameDurationMs - 30 * 1000)
        if((gameDurationMs - 5 * 60 * 1000) > 0) {
            setTimeout(this.handleGameEndsInGiveMinutes.bind(this), gameDurationMs - 5 * 60 * 1000)
        }
    }

    private handleGameEndsInGiveMinutes() {
        this.emit(PlayTimeManager.GAME_END_5_MINUTES)
        this.m_mainScene.chatManager.broadCastMessage("Game will end in 5 minutes")
    }

    private endGame() { 
        this.m_mainScene.chatManager.broadCastMessage("Game will end in 30 seconds")
        setTimeout((() => {
            this.m_mainScene.chatManager.broadCastMessage("The game has ended")
            this.emit(PlayTimeManager.GAME_ENDED)
            this.m_mainScene.room.disconnect()
        }).bind(this), 30 * 1000)
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
    private m_mainScene : MainScene
    private m_playerStartTimes : Map<Player, Date>
    static readonly GAME_STARTED: unique symbol = Symbol();
    static readonly GAME_END_5_MINUTES: unique symbol = Symbol();
    static readonly GAME_ENDED: unique symbol = Symbol();
    
}