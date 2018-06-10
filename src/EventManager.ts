import * as EventEmitter from "events";
// import EventEmitter = require("events");

export class EventManager extends EventEmitter {
  public connection(state: boolean) {
    this.emit("connection", state);
  }
}
