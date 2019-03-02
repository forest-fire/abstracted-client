import {
  RealTimeDB,
  IFirebaseConfig,
  _getFirebaseType,
  IFirebaseClientConfigProps
} from "abstracted-firebase";
import { EventManager } from "./EventManager";
import { DataSnapshot } from "@firebase/database-types";
import { createError, wait } from "common-types";
import { IFirebaseListener, IFirebaseConnectionCallback } from "./@types/general";
export enum FirebaseBoolean {
  true = 1,
  false = 0
}

export let MOCK_LOADING_TIMEOUT = 2000;

export type FirebaseDatabase = import("@firebase/database-types").FirebaseDatabase;
export type FirebaseFirestore = import("@firebase/firestore-types").FirebaseFirestore;
export type FirebaseMessaging = import("@firebase/messaging-types").FirebaseMessaging;
export type FirebaseStorage = import("@firebase/storage-types").FirebaseStorage;
export type FirebaseAuth = import("@firebase/auth-types").FirebaseAuth;
// export type FirebaseFunctions = import("@firebase/functions-types").FirebaseFunctions;

export class DB extends RealTimeDB {
  /**
   * Instantiates a DB and then waits for the connection
   * to finish.
   */
  public static async connect(config?: IFirebaseConfig): Promise<DB> {
    const obj = await new DB(config);

    return obj;
  }

  protected _eventManager: EventManager;
  protected _onConnected: IFirebaseListener[] = [];
  protected _onDisconnected: IFirebaseListener[] = [];
  protected _database: FirebaseDatabase;
  protected _firestore: FirebaseFirestore;
  protected _messaging: FirebaseMessaging;
  protected _storage: FirebaseStorage;
  protected _auth: FirebaseAuth;
  protected _functions: any;
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
    // this starts the "listenForConnectionStatus" event emitter
    this.initialize(config);
  }

  public get auth() {
    import("@firebase/auth");
    return this.app.auth() as FirebaseAuth;
  }

  public get messaging() {
    return _getFirebaseType(this, "messaging") as FirebaseMessaging;
  }

  public get functions() {
    return _getFirebaseType(this, "functions");
  }

  public get storage() {
    return _getFirebaseType(this, "storage") as FirebaseStorage;
  }

  /**
   * get a notification when DB is connected; returns a unique id
   * which can be used to remove the callback. You may, optionally,
   * state a unique id of your own.
   */
  public notifyWhenConnected(cb: IFirebaseConnectionCallback, id?: string): string {
    if (!id) {
      Math.random()
        .toString(36)
        .substr(2, 10);
    } else {
      if (this._onConnected.map(i => i.id).includes(id)) {
        throw createError(
          `abstracted-client/duplicate-listener`,
          `Request for onConnect() notifications was done with an explicit key [ ${id} ] which is already in use!`
        );
      }
    }
    this._onConnected = this._onConnected.concat({ id, cb });
    return id;
  }

  /**
   * Provides a promise-based way of waiting for the connection to be
   * established before resolving
   */
  public async waitForConnection() {
    if (this._mocking) {
      // MOCKING
      if (this._mockLoadingState === "loaded") {
        return;
      }
      const timeout = new Date().getTime() + MOCK_LOADING_TIMEOUT;
      while (this._mockLoadingState === "loading" && new Date().getTime() < timeout) {
        await wait(1);
      }
    } else {
      // NON-MOCKING
      if (this._isConnected) {
        return;
      }

      const connectionEvent = async () => {
        return new Promise((resolve, reject) => {
          this._eventManager.once("connection", (state: boolean) => {
            if (state) {
              resolve();
            } else {
              throw createError(
                "abstracted-client/disconnected-while-connecting",
                `While waiting for connection received a disconnect message`
              );
            }
          });
        });
      };

      const timeout = async () => {
        await wait(this.CONNECTION_TIMEOUT);
        throw createError(
          "abstracted-client/connection-timeout",
          `The database didn't connect after the allocated period of ${
            this.CONNECTION_TIMEOUT
          }ms`
        );
      };
      try {
        await Promise.race([connectionEvent(), timeout()]);
      } catch (e) {
        throw e;
      }
      this._isConnected = true;

      return this;
    }
  }

  /**
   * removes a callback notification previously registered
   */
  public removeNotificationOnConnection(id: string) {
    this._onConnected = this._onConnected.filter(i => i.id !== id);

    return this;
  }

  /**
   * monitorConnection
   *
   * allows interested parties to hook into event messages when the
   * DB connection either connects or disconnects
   */
  protected _monitorConnection(snap: DataSnapshot) {
    this._isConnected = snap.val();
    // call active listeners
    if (this._isConnected) {
      this._eventManager.connection(this._isConnected);
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
    if (!this._isConnected) {
      if (process.env["FIREBASE_CONFIG"]) {
        config = { ...config, ...JSON.parse(process.env["FIREBASE_CONFIG"]) };
      }
      if (!config.apiKey || !config.authDomain || !config.databaseURL) {
        throw new Error("Trying to connect without appropriate firebase configuration!");
      }
      const { name } = config;
      // tslint:disable-next-line:no-submodule-imports
      const firebase = await import("firebase/app");
      import("@firebase/database");
      try {
        const runningApps = new Set(firebase.apps.map(i => i.name));
        this.app = runningApps.has(name)
          ? firebase.app() // TODO: does this connect to the right named DB?
          : (this.app = firebase.initializeApp(config, name));
        // this.enableDatabaseLogging = firebase.database.enableLogging.bind(
        //   firebase.database
        // );
      } catch (e) {
        if (e.message && e.message.indexOf("app/duplicate-app") !== -1) {
          console.log(`The "${name}" app already exists; will proceed.`);
          this._isConnected = true;
        } else {
          throw e;
        }
      }

      this._database = this.app.database();
    } else {
      console.info(`Database ${name} already connected`);
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

  /**
   * Sets up the listening process for connection status
   */
  protected listenForConnectionStatus() {
    this._database.ref(".info/connected").on("value", this._monitorConnection.bind(this));
  }
}
