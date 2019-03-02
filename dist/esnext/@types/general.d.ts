import { DB } from "../db";
export interface IFirebaseListener {
    id: string;
    cb: IFirebaseConnectionCallback;
}
export declare type IFirebaseConnectionCallback = (db?: DB) => void;
