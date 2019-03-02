import { DB } from "../db";

export interface IFirebaseListener {
  id: string;
  cb: IFirebaseConnectionCallback;
}

export type IFirebaseConnectionCallback = (db?: DB) => void;
