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
    const events_1 = require("events");
    // TODO: remove above interface! remove
    class EventManager extends events_1.EventEmitter {
        connection(state) {
            this.emit("connection", state);
        }
    }
    exports.EventManager = EventManager;
});
