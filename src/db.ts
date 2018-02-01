// tslint:disable:no-submodule-imports
// tslint:disable:no-implicit-dependencies
import * as firebase from "firebase";
import "@firebase/auth";
import "@firebase/database";
import { IDictionary } from "common-types";
import * as convert from "typed-conversions";
import { SerializedQuery } from "serialized-query";
import * as moment from "moment";
import * as process from "process";
import { slashNotation } from "./util";
import { RealTimeDB, DebuggingCallback } from "abstracted-firebase";
import { rtdb } from "firebase-api-surface";

export enum FirebaseBoolean {
  true = 1,
  false = 0
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
}

export interface IFirebaseListener {
  id: string;
  cb: (db: DB) => void;
}

export class DB extends RealTimeDB {
  public auth: firebase.auth.Auth;
  constructor(options: IFirebaseConfig = {}, name: string = "[DEFAULT]") {
    super(options);

    if (options.mocking) {
      this._mocking = true;
    } else {
      this.connect(options, name);
      RealTimeDB.connection
        .ref(".info/connected")
        .on("value", this.monitorConnection.bind(this));
    }
  }

  public async waitForConnection() {
    if (RealTimeDB.isConnected) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const cb = () => {
        resolve();
      };
      this._waitingForConnection.push(cb);
    });
  }

  public get isConnected() {
    return RealTimeDB.isConnected;
  }

  private monitorConnection(snap: rtdb.IDataSnapshot) {
    DB.isConnected = snap.val();
    // cycle through temporary clients
    this._waitingForConnection.forEach(cb => cb());
    this._waitingForConnection = [];
    // call active listeners
    if (DB.isConnected) {
      this._onConnected.forEach(listener => listener.cb(this));
    } else {
      this._onDisconnected.forEach(listener => listener.cb(this));
    }
  }

  private connect(options: IFirebaseConfig, name: string = "[DEFAULT]"): void {
    if (!RealTimeDB.isConnected) {
      const config =
        options.config || JSON.parse(process.env["FIREBASE_CONFIG"]);
      if (!config) {
        throw new Error("Trying to connect without firebase configuration!");
      }

      let app: firebase.app.App;
      try {
        app = firebase.initializeApp(config, name);
        const database: rtdb.IFirebaseDatabase = app.database();
        RealTimeDB.connection = database;
        this.auth = app.auth();
      } catch (e) {
        if (e.message.indexOf("app/deplicate-app") !== -1) {
          console.log(`Database named ${name} already exists `);
        } else {
          console.log(`Error connecting to DB: ${e.message} `);
          throw new Error(`Error connecting to DB: ${e.message}`);
        }
      }

      RealTimeDB.isConnected = true;
    }

    if (options.debugging) {
      (RealTimeDB.connection as any).enableLogging(
        typeof options.debugging === "function"
          ? (message: string) => (options.debugging as any)(message)
          : (message: string) => console.log("[FIREBASE]", message)
      );
    }
  }
}
