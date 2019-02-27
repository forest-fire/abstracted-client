"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
class EventManager extends events.EventEmitter {
    connection(state) {
        this.emit("connection", state);
    }
}
exports.EventManager = EventManager;
