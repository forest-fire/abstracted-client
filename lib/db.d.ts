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
    readonly auth: import("../node_modules/@firebase/auth-types/index").FirebaseAuth;
    readonly database: rtdb.IFirebaseDatabase;
    readonly firestore: import("../node_modules/@firebase/firestore-types/index").FirebaseFirestore;
    readonly messaging: import("../node_modules/@firebase/messaging-types/index").FirebaseMessaging;
    readonly functions: import("../node_modules/@firebase/functions-types/index").FirebaseFunctions;
    readonly storage: import("../node_modules/@firebase/storage-types/index").FirebaseStorage;
    protected monitorConnection(snap: rtdb.IDataSnapshot): void;
    protected connectToFirebase(config: IFirebaseClientConfigProps): Promise<void>;
    protected listenForConnectionStatus(): void;
}
