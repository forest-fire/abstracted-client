import { RealTimeDB, IFirebaseClientConfig } from "abstracted-firebase";
import { EventManager } from "./EventManager";
import { FirebaseNamespace, FirebaseApp } from "@firebase/app-types";
export declare enum FirebaseBoolean {
    true = 1,
    false = 0
}
export declare let MOCK_LOADING_TIMEOUT: number;
export declare type FirebaseDatabase = import("abstracted-firebase").FirebaseDatabase;
export declare type FirebaseAuth = import("abstracted-firebase").FirebaseAuth;
export { IFirebaseClientConfig } from "abstracted-firebase";
export declare class DB extends RealTimeDB<FirebaseAuth> {
    /**
     * Instantiates a DB and then waits for the connection
     * to finish.
     */
    static connect(config?: IFirebaseClientConfig): Promise<DB>;
    /** lists the database names which are currently connected */
    static connectedTo(): Promise<string[]>;
    protected _eventManager: EventManager;
    protected _clientType: "client" | "admin";
    protected _database: FirebaseDatabase;
    protected _auth: FirebaseAuth;
    protected _fbClass: FirebaseNamespace | (FirebaseNamespace & {
        auth: () => FirebaseNamespace["auth"];
    });
    protected _authProviders: FirebaseNamespace["auth"];
    protected app: FirebaseApp;
    constructor(config: IFirebaseClientConfig);
    /**
     * access to provider specific providers
     */
    get authProviders(): FirebaseNamespace["auth"];
    auth(): Promise<FirebaseAuth>;
    /**
     * connect
     *
     * Asynchronously loads the firebase/app library and then
     * initializes a connection to the database.
     */
    protected connectToFirebase(config: IFirebaseClientConfig, useAuth?: boolean): Promise<void>;
    /**
     * Sets up the listening process for connection status
     */
    protected listenForConnectionStatus(): void;
}
