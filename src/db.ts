import {
  RealTimeDB,
  IFirebaseClientConfigProps,
  IFirebaseClientConfig,
  isMockConfig
} from "abstracted-firebase";
import { EventManager } from "./EventManager";
import { ClientError } from "./ClientError";
import { FirebaseNamespace } from "@firebase/app-types";

export enum FirebaseBoolean {
  true = 1,
  false = 0
}

export let MOCK_LOADING_TIMEOUT = 200;

export type FirebaseDatabase = import("@firebase/database-types").FirebaseDatabase;
export type FirebaseAuth = import("@firebase/auth-types").FirebaseAuth;

export { IFirebaseClientConfig } from "abstracted-firebase";

export class DB extends RealTimeDB<FirebaseAuth> {
  /**
   * Instantiates a DB and then waits for the connection
   * to finish.
   */
  public static async connect(config?: IFirebaseClientConfig): Promise<DB> {
    const obj = new DB(config);
    await obj.waitForConnection();

    return obj;
  }

  /** lists the database names which are currently connected */
  public static async connectedTo() {
    // tslint:disable-next-line:no-submodule-imports
    const fb = await import("@firebase/app");
    await import("@firebase/database");
    return Array.from(new Set(fb.firebase.apps.map(i => i.name)));
  }

  protected _eventManager: EventManager;
  protected _clientType: "client" | "admin" = "client";
  protected _database: FirebaseDatabase;
  protected _auth: FirebaseAuth;
  protected _authProviders: FirebaseNamespace["auth"];
  protected app: any;

  constructor(config: IFirebaseClientConfig) {
    super(config);
    this._eventManager = new EventManager();
    // this starts the "listenForConnectionStatus" event emitter
    this.initialize(config);
  }

  /**
   * access to provider specific providers
   */
  get authProviders(): FirebaseNamespace["auth"] {
    if (!this._authProviders) {
      throw new ClientError(
        `Attempt to get the authProviders getter before connecting to the database!`
      );
    }

    return this._authProviders;
  }

  public async auth(): Promise<FirebaseAuth> {
    if (this._auth) {
      return this._auth;
    }
    if (!this.isConnected) {
      await this.waitForConnection();
    }
    if (this._mocking) {
      this._auth = await this.mock.auth();
      return this._auth;
    }
    await import(/* webpackChunkName: "firebase-auth" */ "@firebase/auth");
    this._auth = this.app.auth() as FirebaseAuth;
    return this._auth;
  }

  /**
   * connect
   *
   * Asynchronously loads the firebase/app library and then
   * initializes a connection to the database.
   */
  protected async connectToFirebase(config: IFirebaseClientConfig) {
    if (isMockConfig(config)) {
      // MOCK DB
      await this.getFireMock({
        db: config.mockData || {},
        auth: config.mockAuth || {}
      });
      this._authProviders = this._mock
        .authProviders as FirebaseNamespace["auth"];
      this._isConnected = true;
    } else {
      // REAL DB
      if (!this._isConnected) {
        if (process.env["FIREBASE_CONFIG"]) {
          config = { ...config, ...JSON.parse(process.env["FIREBASE_CONFIG"]) };
        }
        config = config as IFirebaseClientConfigProps;
        if (!config.apiKey || !config.authDomain || !config.databaseURL) {
          throw new Error(
            "Trying to connect without appropriate firebase configuration!"
          );
        }
        config.name =
          config.name ||
          config.databaseURL.replace(/.*https:\W*([\w-]*)\.((.|\n)*)/g, "$1");

        // tslint:disable-next-line:no-submodule-imports
        const fb = await import(
          /* webpackChunkName: "firebase-app" */ "@firebase/app"
        );
        await import(
          /* webpackChunkName: "firebase-db" */ "@firebase/database"
        );
        try {
          const runningApps = new Set(fb.firebase.apps.map(i => i.name));
          this.app = runningApps.has(config.name)
            ? fb.firebase.app(config.name) // TODO: does this connect to the right named DB?
            : fb.firebase.initializeApp(config, config.name);
        } catch (e) {
          if (e.message && e.message.indexOf("app/duplicate-app") !== -1) {
            console.log(`The "${name}" app already exists; will proceed.`);
            this._isConnected = true;
          } else {
            throw e;
          }
        }
        this._authProviders = fb.default.auth;
        this._database = this.app.database();
      } else {
        console.info(`Database ${config.name} already connected`);
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
  }

  /**
   * Sets up the listening process for connection status
   */
  protected listenForConnectionStatus() {
    if (!this._mocking) {
      this._database
        .ref(".info/connected")
        .on("value", snap => this._monitorConnection.bind(this)(snap));
    } else {
      // console.info(`Listening for connection changes on Mock DB`);
    }
  }
}
