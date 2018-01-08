// tslint:disable:no-submodule-imports
// tslint:disable:no-implicit-dependencies
import FirebaseApp = require("firebase/app");
import * as RTDB from "@firebase/database";
import { IDictionary } from "common-types";
import * as convert from "typed-conversions";
import { SerializedQuery } from "serialized-query";
import * as moment from "moment";
import * as process from "process";
import { slashNotation } from "./util";
import { Mock, Reference, resetDatabase } from "firemock";
import { RealTimeDB, DebuggingCallback } from "abstracted-firebase";
import { FirebaseDatabase } from "@firebase/database-types";
import { FirebaseAuth } from "@firebase/auth-types";

export enum FirebaseBoolean {
  true = 1,
  false = 0
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

export class DB extends RealTimeDB {
  public static auth: FirebaseAuth;
  constructor(config: IFirebaseClientConfig = {}) {
    super(config);
    if (config.mocking) {
      this._mocking = true;
    } else {
      this.connect(config);

      RealTimeDB.connection.ref(".info/connected").on("value", snap => {
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
      });
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

  private connect(c: IFirebaseClientConfig): void {
    if (!RealTimeDB.isConnected) {
      const config = c.config || process.env["FIREBASE_CONFIG"];
      const firebase = FirebaseApp.initializeApp(config);
      RealTimeDB.connection = firebase.database();
      DB.auth = RealTimeDB.connection.app.auth();
      RealTimeDB.isConnected = true;
    }

    if (c.debugging) {
      // FirebaseApp.enableLogging(
      //   typeof c.debugging === "function"
      //     ? (message: string) => debugging(message)
      //     : (message: string) => console.log("[FIREBASE]", message)
      // );
    }
  }
}
