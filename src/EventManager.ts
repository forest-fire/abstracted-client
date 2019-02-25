import { EventEmitter } from "events";
export interface IEmitter {
  emit: (event: string | symbol, ...args: any[]) => boolean;
  on: (event: string, value: any) => void;
  once: (event: string, value: any) => void;
}

// TODO: remove above interface! remove
export class EventManager extends EventEmitter implements IEmitter {
  public connection(state: boolean) {
    this.emit("connection", state);
  }
}
