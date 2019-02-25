/// <reference types="node" />
import { EventEmitter } from "events";
export interface IEmitter {
    emit: (event: string | symbol, ...args: any[]) => boolean;
    on: (event: string, value: any) => void;
    once: (event: string, value: any) => void;
}
export declare class EventManager extends EventEmitter implements IEmitter {
    connection(state: boolean): void;
}
