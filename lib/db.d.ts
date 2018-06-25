import { RealTimeDB, IFirebaseConfig, IFirebaseClientConfigProps } from "abstracted-firebase";
import { rtdb } from "firebase-api-surface";
import { EventManager } from "./EventManager";
import { FirebaseDatabase } from "@firebase/database-types";
import { FirebaseFirestore } from "@firebase/firestore-types";
import { FirebaseMessaging } from "@firebase/messaging-types";
import { FirebaseStorage } from "@firebase/storage-types";
import { FirebaseFunctions } from "@firebase/functions-types";
import { FirebaseAuth } from "@firebase/auth-types";
export declare enum FirebaseBoolean {
    true = 1,
    false = 0
}
export interface IFirebaseListener {
    id: string;
    cb: (db: DB) => void;
}
export declare class DB extends RealTimeDB {
    static connect(config?: IFirebaseConfig): Promise<DB>;
    protected _eventManager: EventManager;
    protected _database: FirebaseDatabase;
    protected _firestore: FirebaseFirestore;
    protected _messaging: FirebaseMessaging;
    protected _storage: FirebaseStorage;
    protected _auth: FirebaseAuth;
    protected _functions: FirebaseFunctions;
    protected app: any;
    constructor(config: IFirebaseConfig);
    readonly auth: FirebaseAuth;
    readonly database: rtdb.IFirebaseDatabase;
    readonly firestore: FirebaseFirestore;
    readonly messaging: FirebaseMessaging;
    readonly functions: FirebaseFunctions;
    readonly storage: FirebaseStorage;
    protected monitorConnection(snap: rtdb.IDataSnapshot): void;
    protected connectToFirebase(config: IFirebaseClientConfigProps): Promise<void>;
    protected listenForConnectionStatus(): void;
}
