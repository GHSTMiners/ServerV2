export default class Config {
    public static apiURL : string = 'https://chisel.gotchiminer.rocks/api'
    public static rpcURL : string = 'https://rpc-mainnet.maticvigil.com/v1/2affc0cebae5346c27dc4edd49db3dba5a063764'
    public static apiKey : string = 'qwW6uXbkhC6hxAR0z6Rl5DwQ001uYYFxWvwBEyF7E6chOeUDZ0'
    public static gravity : number = 1000
    public static deathTimeout : number = 5000
    public static blockWidth : number = 128
    public static blockHeight : number = 128
    public static explosiveTimeout = 3000
    public static gameDuration = 30 * 60 
    public static blockWidthOffset = Config.blockWidth / 2
    public static blockHeightOffset = Config.blockHeight / 2
    public static blockCollisionRadio = 4
    public static layerRevealRadius = 8
    public static layerBuildingRadius = 4
}