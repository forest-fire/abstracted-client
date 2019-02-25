import { EventEmitter } from "events";
// TODO: remove above interface! remove
export class EventManager extends EventEmitter {
    connection(state) {
        this.emit("connection", state);
    }
}
