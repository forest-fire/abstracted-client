import { RealTimeDB, DebuggingCallback } from "abstracted-firebase";
import { FirebaseAuth } from "@firebase/auth-types";
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
    name?: string;
}
export interface IFirebaseListener {
    id: string;
    cb: (db: DB) => void;
}
export declare class DB extends RealTimeDB {
    static auth: FirebaseAuth;
    constructor(config?: IFirebaseConfig);
    waitForConnection(): Promise<void | {}>;
    readonly isConnected: boolean;
    private monitorConnection(snap);
    private connect(c);
}
