import * as firebase from "firebase";
import "@firebase/auth";
import "@firebase/database";
import { RealTimeDB, DebuggingCallback } from "abstracted-firebase";
export declare enum FirebaseBoolean {
    true = 1,
    false = 0,
}
export interface IFirebaseConfig {
    debugging?: boolean | DebuggingCallback;
    mocking?: boolean;
    config?: IFirebaseClientConfig;
}
export interface IFirebaseClientConfig {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
}
export interface IFirebaseListener {
    id: string;
    cb: (db: DB) => void;
}
export declare class DB extends RealTimeDB {
    auth: firebase.auth.Auth;
    constructor(options?: IFirebaseConfig, name?: string);
    waitForConnection(): Promise<void | {}>;
    readonly isConnected: boolean;
    private monitorConnection(snap);
    private connect(options, name?);
}
