import * as EventEmitter from "events";
// import EventEmitter = require("events");
export class EventManager extends EventEmitter {
    connection(state) {
        this.emit("connection", state);
    }
}
