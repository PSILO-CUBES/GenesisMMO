import * as ex from "excalibur";
import {DOWN, UP, LEFT, RIGHT} from "../constants.js";

export class DirectionQueue {
  constructor() {
    this.heldDirections = [];
  }

  get direction() {
    return this.heldDirections[0] ?? null;
  }

  add(dir) {
    const exists = this.heldDirections.includes(dir);
    if (exists) {
      return;
    }
    this.heldDirections.unshift(dir);
  }

  remove(dir) {
    this.heldDirections = this.heldDirections.filter((d) => d !== dir);
  }

  update(engine) {
    [
      { key: ex.Input.Keys.A, dir: LEFT },
      { key: ex.Input.Keys.D, dir: RIGHT },
      { key: ex.Input.Keys.W, dir: UP },
      { key: ex.Input.Keys.S, dir: DOWN },
    ].forEach((group) => {
      if (engine.input.keyboard.wasPressed(group.key)) {
        this.add(group.dir);
      }
      if (engine.input.keyboard.wasReleased(group.key)) {
        this.remove(group.dir);
      }
    });
  }
}
