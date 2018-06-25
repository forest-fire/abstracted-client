// tslint:disable:whitespace
import {
  RealTimeDB,
  IFirebaseConfig,
  _getFirebaseType,
  IFirebaseClientConfigProps
} from "abstracted-firebase";
import { rtdb } from "firebase-api-surface";
import { EventManager } from "./EventManager";
// tslint:disable:no-implicit-dependencies
import { FirebaseDatabase } from "@firebase/database-types";
import { FirebaseFirestore } from "@firebase/firestore-types";
import { FirebaseMessaging } from "@firebase/messaging-types";
import { FirebaseStorage } from "@firebase/storage-types";
import { FirebaseFunctions } from "@firebase/functions-types";
import { FirebaseAuth } from "@firebase/auth-types";
export enum FirebaseBoolean {
  true = 1,
  false = 0
}

// Typescript 2.9 way ... doesn't seem to transpile well
// -----------------------------------------------------
// export type FirebaseDatabase = import("@firebase/database-types").FirebaseDatabase;
// export type FirebaseFirestore = import("@firebase/firestore-types").FirebaseFirestore;
// export type FirebaseMessaging = import("@firebase/messaging-types").FirebaseMessaging;
// export type FirebaseStorage = import("@firebase/storage-types").FirebaseStorage;
// export type FirebaseAuth = import("@firebase/auth-types").FirebaseAuth;
// export type FirebaseFunctions = import("@firebase/functions-types").FirebaseFunctions;

export interface IFirebaseListener {
  id: string;
  cb: (db: DB) => void;
}

export class DB extends RealTimeDB {
  /**
   * Instantiates a DB and then waits for the connection
   * to finish.
   */
  public static async connect(config?: IFirebaseConfig) {
    const obj = new DB(config);
    await obj.waitForConnection();
    return obj;
  }

  protected _eventManager: EventManager;
  protected _database: FirebaseDatabase;
  protected _firestore: FirebaseFirestore;
  protected _messaging: FirebaseMessaging;
  protected _storage: FirebaseStorage;
  protected _auth: FirebaseAuth;
  protected _functions: FirebaseFunctions;
  protected app: any;

  constructor(config: IFirebaseConfig) {
    super();
    this._eventManager = new EventManager();
    config = {
      ...{
        name: "[DEFAULT]"
      },
      ...config
    };
    this.initialize(config);
  }

  public get auth() {
    return _getFirebaseType(this, "auth") as FirebaseAuth;
  }

  public get database() {
    return _getFirebaseType(this, "database") as rtdb.IFirebaseDatabase;
  }

  public get firestore() {
    return _getFirebaseType(this, "firestore") as FirebaseFirestore;
  }

  public get messaging() {
    return _getFirebaseType(this, "messaging") as FirebaseMessaging;
  }

  public get functions() {
    return _getFirebaseType(this, "functions") as FirebaseFunctions;
  }

  public get storage() {
    return _getFirebaseType(this, "storage") as FirebaseStorage;
  }

  protected monitorConnection(snap: rtdb.IDataSnapshot) {
    this._isConnected = snap.val();
    // cycle through temporary clients
    this._waitingForConnection.forEach(cb => cb());
    this._waitingForConnection = [];
    // call active listeners
    if (this.isConnected) {
      this._onConnected.forEach(listener => listener.cb(this));
    } else {
      this._onDisconnected.forEach(listener => listener.cb(this));
    }
  }

  /**
   * connect
   *
   * Asynchronously loads the firebase/app library and then
   * initializes a connection to the database.
   */
  protected async connectToFirebase(config: IFirebaseClientConfigProps) {
    if (!this.isConnected) {
      if (process.env["FIREBASE_CONFIG"]) {
        config = { ...config, ...JSON.parse(process.env["FIREBASE_CONFIG"]) };
      }
      if (!config.apiKey || !config.authDomain || !config.databaseURL) {
        throw new Error("Trying to connect without appropriate firebase configuration!");
      }
      const { name } = config;
      // tslint:disable-next-line:no-submodule-imports
      const firebase = await import("firebase/app");
      try {
        const runningApps = new Set(firebase.apps.map(i => i.name));
        this.app = runningApps.has(name)
          ? firebase.app()
          : (this.app = firebase.initializeApp(config, name));
        // this.enableDatabaseLogging = firebase.database.enableLogging.bind(
        //   firebase.database
        // );
      } catch (e) {
        if (e.message && e.message.indexOf("app/duplicate-app") !== -1) {
          console.log(JSON.stringify(e));
          console.log(`The "${name}" app already exists; will proceed.`);
          this._isConnected = true;
        } else {
          throw e;
        }
      }
      this._database = this.app.database();
      this._eventManager.connection(true);
    }
    // TODO: relook at debugging func
    if (config.debugging) {
      this.enableDatabaseLogging(
        typeof config.debugging === "function"
          ? (message: string) => (config.debugging as any)(message)
          : (message: string) => console.log("[FIREBASE]", message)
      );
    }
  }

  protected listenForConnectionStatus() {
    this._database.ref(".info/connected").on("value", this.monitorConnection.bind(this));
  }
}
