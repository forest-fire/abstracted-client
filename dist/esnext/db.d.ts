import { RealTimeDB, IFirebaseConfig, IFirebaseClientConfigProps } from "abstracted-firebase";
import { rtdb } from "firebase-api-surface";
import { EventManager } from "./EventManager";
export declare enum FirebaseBoolean {
    true = 1,
    false = 0
}
export declare type FirebaseDatabase = import("@firebase/database-types").FirebaseDatabase;
export declare type FirebaseFirestore = import("@firebase/firestore-types").FirebaseFirestore;
export declare type FirebaseMessaging = import("@firebase/messaging-types").FirebaseMessaging;
export declare type FirebaseStorage = import("@firebase/storage-types").FirebaseStorage;
export declare type FirebaseAuth = import("@firebase/auth-types").FirebaseAuth;
export declare type FirebaseFunctions = import("@firebase/functions-types").FirebaseFunctions;
export interface IFirebaseListener {
    id: string;
    cb: (db: DB) => void;
}
export declare type FirebaseApp = typeof import("firebase/app");
export declare class DB extends RealTimeDB {
    /** Logs debugging information to the console */
    enableDatabaseLogging: (logger?: boolean | ((a: string) => any), persistent?: boolean) => any;
    protected _eventManager: EventManager;
    protected _database: FirebaseDatabase;
    protected _firestore: FirebaseFirestore;
    protected _messaging: FirebaseMessaging;
    protected _storage: FirebaseStorage;
    protected _auth: FirebaseAuth;
    protected _functions: FirebaseFunctions;
    protected app: any;
    constructor(config: IFirebaseConfig);
    readonly auth: import("@firebase/auth-types").FirebaseAuth;
    readonly database: rtdb.IFirebaseDatabase;
    readonly firestore: import("@firebase/firestore-types").FirebaseFirestore;
    readonly messaging: import("@firebase/messaging-types").FirebaseMessaging;
    readonly functions: import("@firebase/functions-types").FirebaseFunctions;
    readonly storage: import("@firebase/storage-types").FirebaseStorage;
    protected monitorConnection(snap: rtdb.IDataSnapshot): void;
    /**
     * connect
     *
     * Asynchronously loads the firebase/app library and then
     * initializes a connection to the database.
     */
    protected connectToFirebase(config: IFirebaseClientConfigProps): Promise<void>;
    protected listenForConnectionStatus(): void;
}
