import { RealTimeDB, DebuggingCallback } from "abstracted-firebase";
import { FirebaseAuth } from "@firebase/auth-types";
export declare enum FirebaseBoolean {
    true = 1,
    false = 0,
}
export interface IFirebaseClientConfig {
    debugging?: boolean | DebuggingCallback;
    mocking?: boolean;
    config?: IFirebaseClientConfig;
}
export interface IFirebaseListener {
    id: string;
    cb: (db: DB) => void;
}
export declare class DB extends RealTimeDB {
    static auth: FirebaseAuth;
    constructor(config?: IFirebaseClientConfig);
    waitForConnection(): Promise<void | {}>;
    readonly isConnected: boolean;
    private connect(c);
}
