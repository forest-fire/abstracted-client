import { EventEmitter } from "events";
import { IEmitter } from "abstracted-firebase";
export declare class EventManager extends EventEmitter implements IEmitter {
  public connection(state: boolean): void;
}
