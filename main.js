import * as ex from '/excalibur'
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH, SCALE, EVENT_SEND_PLAYER_UPDATE } from './src/constants'
import { Player } from './src/actors/Players/Player.js'
import { Floor } from './src/actors/Floor.js'
import { loader } from './src/resources.js'
import { Map_Indoor } from './src/maps/Map_Indoor.js'
import { Player_CameraStrategy } from './src/classes/Player_CameraStrategy.js'
import { NetworkClient } from './src/classes/NetworkClient.js'
import { NetworkActorsMap } from './src/classes/NetworkActorsMap.js'

const game = new ex.Engine({
  width: VIEWPORT_WIDTH * SCALE,
  height: VIEWPORT_HEIGHT * SCALE,
  fixedUpdateFps: 60,
  antialiasing: false,
  backgroundColor: ex.Color.Black
})

const map = new Map_Indoor()
game.add(map)

const player = new Player(200, 200, "RED")
game.add(player)



game.on("initialize", () => {
  const cameraStaregy = new Player_CameraStrategy(player, map)
  game.currentScene.camera.addStrategy(cameraStaregy)

  new NetworkActorsMap(game)
  const peer = new NetworkClient(game)

  game.on(EVENT_SEND_PLAYER_UPDATE, update =>{
    peer.sendUpdate(update)
  })
})

game.start(loader)