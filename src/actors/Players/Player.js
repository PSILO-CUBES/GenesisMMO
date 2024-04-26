import * as ex from 'excalibur'
import { ANCHOR_CENTER, UP, DOWN, LEFT, RIGHT, SCALE_2x, EVENT_INITIAL_DATA_REQUESTED, EVENT_SEND_PLAYER_UPDATE } from '../../constants.js'
import { DirectionQueue } from '../../classes/DirectionQueue.js'
import { DrawShapeHelper } from '../../classes/DrawShapeHelper.js'
import { generateCharacterAnimations } from '../../character-animations.js'
import { PlayerAnimations } from './PlayerAnimations.js'
import { PlayerActions } from './PlayerActions.js'
import { NetworkUpdater } from '../../classes/NetworkUpdater.js'

const ACTION_1_KEY = ex.Input.Keys.Space
const ACTION_2_KEY = ex.Input.Keys.ShiftLeft

export class Player extends ex.Actor {
	constructor(x, y, skinId){
	  super({
	    pos: new ex.Vector(x, y),
	    width: 32,
	    height: 32,
	    scale: SCALE_2x,
	    collider: ex.Shape.Box(15, 15, ANCHOR_CENTER, new ex.Vector(0, 6)),
	    collisionType: ex.CollisionType.Active,
			color: ex.Color.Orange
	  })

		this.directionQueue = new DirectionQueue()
    this.facing = DOWN
    this.actionAnimation = null
    this.isPainFlashing = false
    this.painState = null
    this.skinId = skinId

    this.skinAnims = generateCharacterAnimations(skinId)
    this.graphics.use(this.skinAnims["DOWN"]["WALK"])
	}

  onInitialize(engine){
    // new DrawShapeHelper(this)
    this.playerAnimations = new PlayerAnimations(this)
    this.playerActions = new PlayerActions(this)
    this.networkUpdater = new NetworkUpdater(engine, EVENT_SEND_PLAYER_UPDATE)
  }

  createNetworkUpdateString() {
    const actionType = this.actionAnimation?.type ?? "NULL"
    const isInPain = Boolean(this.painState)
    const x = Math.round(this.pos.x)
    const y = Math.round(this.pos.y)
    return `${actionType}|${x}|${y}|${this.vel.x}|${this.vel.y}|${this.skinId}|${this.facing}|${isInPain}|${this.isPainFlashing}`;
  }

  takeDamage(){
    if(this.isPainFlashing) return 

    const PAIN_VELOCITY = 150
    this.painState = {
      msLeft: 220,
      painVelX: this.facing === LEFT ? PAIN_VELOCITY : -PAIN_VELOCITY,
      painVelY: this.facing === UP ? PAIN_VELOCITY : -PAIN_VELOCITY
    }

    this.playerActions?.flashSeries()
  }

	onPreUpdate(engine, delta){
		this.directionQueue.update(engine)

    this.playerAnimations.progressThroughActionAnimation(delta)

    if(!this.actionAnimation){
      this.onPreUpdateMovementKeys(engine, delta)
      this.onPreUpdateActionKeys(engine)
    }
    
    this.playerAnimations.showRelevantAnim()

    const networkUpdateStr = this.createNetworkUpdateString()
    this.networkUpdater.sendStateUpdate(networkUpdateStr )  
	}

	onPreUpdateMovementKeys(engine, delta) {

    if(this.painState) {
      this.vel.x = this.painState.painVelX
      this.vel.y = this.painState.painVelY

      this.painState.msLeft -= delta;
      if (this.painState.msLeft <= 0) {
        this.painState = null
      }
      return
    }

    const keyboard = engine.input.keyboard;
    const WALKING_SPEED = 160;

    this.vel.x = 0;
    this.vel.y = 0;
    if (keyboard.isHeld(ex.Input.Keys.A)) {
      this.vel.x = -1;
    }
    if (keyboard.isHeld(ex.Input.Keys.D)) {
      this.vel.x = 1;
    }
    if (keyboard.isHeld(ex.Input.Keys.W)) {
      this.vel.y = -1;
    }
    if (keyboard.isHeld(ex.Input.Keys.S)) {
      this.vel.y = 1;
    }

    // Normalize walking speed
    if (this.vel.x !== 0 || this.vel.y !== 0) {
      this.vel = this.vel.normalize();
      this.vel.x = this.vel.x * WALKING_SPEED;
      this.vel.y = this.vel.y * WALKING_SPEED;
    }

    this.facing = this.directionQueue.direction ?? this.facing;
  }

  onPreUpdateActionKeys(engine){
    if(engine.input.keyboard.wasPressed(ACTION_1_KEY)) {
      this.playerActions?.actionSwingSword()
      return
    }

    if(engine.input.keyboard.wasPressed(ACTION_2_KEY)) {
      this.playerActions?.actionShootArrow()
      return
    }

    [
      { key : ex.Input.Keys.Digit1, skinId: "RED" },
      { key : ex.Input.Keys.Digit2, skinId: "BLUE" },
      { key : ex.Input.Keys.Digit3, skinId: "GRAY" },
      { key : ex.Input.Keys.Digit4, skinId: "YELLOW" },
      { key : ex.Input.Keys.Digit5, skinId: "MRRANDOM" },
    ].forEach(({key, skinId}) => {
      if(engine.input.keyboard.wasPressed(key)){
        this.skinId = skinId
        this.skinAnims = generateCharacterAnimations(skinId)
      }
    })

    if(engine.input.keyboard.wasPressed(ex.Input.Keys.F)) {
      this.takeDamage()
    }
  }

}