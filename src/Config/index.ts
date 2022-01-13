export default class Config {

    // public static colyseusURL : string = 'wss://server.gotchiminer.rocks'
    public static colyseusURL : string = 'ws://localhost:2567'
    public static apiURL : string = 'https://chisel.gotchiminer.rocks/api'
    public static rpcURL : string = 'https://rpc-mainnet.maticvigil.com/v1/2affc0cebae5346c27dc4edd49db3dba5a063764'
    public static blockWidth : number = 128
    public static blockHeight : number = 128
    public static skyLayers : number = 50
    public static skyHeight : number = Config.blockHeight * Config.skyLayers
    public static blockWidthOffset = Config.blockWidth / 2
    public static blockHeightOffset = Config.blockHeight / 2
    public static blockCollisionRadio = 4
    public static layerRevealRadius = 8
}