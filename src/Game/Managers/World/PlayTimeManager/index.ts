import * as Protocol from "gotchiminer-multiplayer-protocol"
import PlayerManager from "../PlayerManager";
import Player from "../../../Objects/Player";
import Config from "../../../../Config";
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
        scene.chatManager.broadCastMessage("Game will start in 30 seconds")
        setTimeout(this.startGame.bind(this), 1000 * 30)
    }

    private startGame() {
        if(!this.m_mainScene.room.state.ready) {
            // Send notification to all clients
            let response : Protocol.NotifyGameStarted = new Protocol.NotifyGameStarted();
            response.timestamp = Date.now();
            let serializedResponse : Protocol.Message = Protocol.MessageSerializer.serialize(response);
            this.m_mainScene.room.broadcast(serializedResponse.name, serializedResponse.data)
            // Send chat message and update game state
            this.m_mainScene.chatManager.broadCastMessage(`The game has started, you have ${Config.gameDuration/60} minutes`)
            this.m_mainScene.room.state.ready = true
            // Calculate durations and set timers for game end
            let gameDurationMs : number = Config.gameDuration * 1000
            this.m_gameStartTime = new Date(Date.now());
            this.m_gameEndTime = new Date(Date.now() + gameDurationMs)
            this.m_mainScene.room.state.gameEndUTC = this.m_gameEndTime.getTime()
            this.m_mainScene.room.state.gameStartUTC = this.m_gameStartTime.getTime()
            this.emit(PlayTimeManager.GAME_STARTED)
            setTimeout(this.endGame.bind(this), gameDurationMs - 30 * 1000)
            if((gameDurationMs - 5 * 60 * 1000) > 0) {
                setTimeout(this.handleGameEndsInGiveMinutes.bind(this), gameDurationMs - 5 * 60 * 1000)
            }
        }
    }

    private handlePlayerRequestStartGame(player : Player) {
        this.m_playerStartTimes.set(player, new Date(Date.now()))
        if(this.m_playerStartTimes.size >= this.m_mainScene.clientManager.expectedPlayerCount) {
            this.startGame();
        }
    }

    private handleGameEndsInGiveMinutes() {
        this.emit(PlayTimeManager.GAME_END_5_MINUTES)
        this.m_mainScene.chatManager.broadCastMessage("Game will end in 5 minutes")
    }

    public terminate() {
        this.emit(PlayTimeManager.GAME_ENDED)
        // Submit all stats
        let promises : Promise<boolean>[] = []
        this.m_mainScene.playerManager.players().forEach(player => {
            promises.push(player.statisticsManager().submit())
        });
        promises.push(this.m_mainScene.loggingManager.upload().finally())
        Promise.allSettled<boolean>(promises).finally(() => {
            // Send notification to all clients
            let response : Protocol.NotifyGameEnded = new Protocol.NotifyGameEnded();
            let serializedResponse : Protocol.Message = Protocol.MessageSerializer.serialize(response);
            this.m_mainScene.room.broadcast(serializedResponse.name, serializedResponse.data)
            // Send chat message and disconnect clients
            this.m_mainScene.chatManager.broadCastMessage("The game has ended")
            this.m_mainScene.room.disconnect()
        })
    }

    private endGame() { 
        this.m_mainScene.chatManager.broadCastMessage("Game will end in 30 seconds")
        setTimeout(this.terminate.bind(this), 30 * 1000)
    }

    private handlePlayerJoined(player : Player) {
        var self = this;
        player.client().messageRouter.addRoute(Protocol.RequestStartGame, () => {
            self.handlePlayerRequestStartGame(player);
        })
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