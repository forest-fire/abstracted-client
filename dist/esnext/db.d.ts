import { RealTimeDB, IFirebaseConfig, IFirebaseClientConfigProps } from "abstracted-firebase";
import { EventManager } from "./EventManager";
import { DataSnapshot } from "@firebase/database-types";
import { IFirebaseListener, IFirebaseConnectionCallback } from "./@types/general";
export declare enum FirebaseBoolean {
    true = 1,
    false = 0
}
export declare type FirebaseDatabase = import("@firebase/database-types").FirebaseDatabase;
export declare type FirebaseMessaging = import("@firebase/messaging-types").FirebaseMessaging;
export declare type FirebaseStorage = import("@firebase/storage-types").FirebaseStorage;
export declare type FirebaseAuth = import("@firebase/auth-types").FirebaseAuth;
export declare type FirebaseFunctions = import("@firebase/functions-types").FirebaseFunctions;
export declare type FirebaseFirestore = import("@firebase/firestore-types").FirebaseFirestore;
export declare class DB extends RealTimeDB {
    /**
     * Instantiates a DB and then waits for the connection
     * to finish.
     */
    static connect(config?: IFirebaseConfig): Promise<DB>;
    protected _eventManager: EventManager;
    protected _onConnected: IFirebaseListener[];
    protected _onDisconnected: IFirebaseListener[];
    protected _database: FirebaseDatabase;
    protected _firestore: FirebaseFirestore;
    protected _messaging: FirebaseMessaging;
    protected _storage: FirebaseStorage;
    protected _auth: FirebaseAuth;
    protected _functions: any;
    protected app: any;
    constructor(config: IFirebaseConfig);
    readonly auth: import("@firebase/auth-types").FirebaseAuth;
    readonly messaging: import("@firebase/messaging-types").FirebaseMessaging;
    readonly functions: any;
    readonly storage: import("@firebase/storage-types").FirebaseStorage;
    /**
     * get a notification when DB is connected; returns a unique id
     * which can be used to remove the callback. You may, optionally,
     * state a unique id of your own.
     */
    notifyWhenConnected(cb: IFirebaseConnectionCallback, id?: string): string;
    /**
     * Provides a promise-based way of waiting for the connection to be
     * established before resolving
     */
    waitForConnection(): Promise<this>;
    /**
     * removes a callback notification previously registered
     */
    removeNotificationOnConnection(id: string): this;
    /**
     * monitorConnection
     *
     * allows interested parties to hook into event messages when the
     * DB connection either connects or disconnects
     */
    protected _monitorConnection(snap: DataSnapshot): void;
    /**
     * connect
     *
     * Asynchronously loads the firebase/app library and then
     * initializes a connection to the database.
     */
    protected connectToFirebase(config: IFirebaseClientConfigProps): Promise<void>;
    /**
     * Sets up the listening process for connection status
     */
    protected listenForConnectionStatus(): void;
}
