"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
class EventManager extends EventEmitter {
    connection(state) {
        this.emit("connection", state);
    }
}
exports.EventManager = EventManager;
