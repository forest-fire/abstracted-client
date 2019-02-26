import { EventEmitter } from "events";
export interface IEmitter {
  emit: (event: string | symbol, ...args: any[]) => boolean;
  on: (event: string, value: any) => void;
  once: (event: string, value: any) => void;
}
import { IEmitter } from "abstracted-firebase";
export declare class EventManager extends EventEmitter implements IEmitter {
  public connection(state: boolean): void;
}
