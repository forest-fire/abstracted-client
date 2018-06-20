(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "events"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const EventEmitter = require("events");
    class EventManager extends EventEmitter {
        connection(state) {
            this.emit("connection", state);
        }
    }
    exports.EventManager = EventManager;
});
