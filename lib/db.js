"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase = require("firebase");
const process = require("process");
const abstracted_firebase_1 = require("abstracted-firebase");
var FirebaseBoolean;
(function (FirebaseBoolean) {
    FirebaseBoolean[FirebaseBoolean["true"] = 1] = "true";
    FirebaseBoolean[FirebaseBoolean["false"] = 0] = "false";
})(FirebaseBoolean = exports.FirebaseBoolean || (exports.FirebaseBoolean = {}));
class DB extends abstracted_firebase_1.RealTimeDB {
    constructor(options = {}, name = "[DEFAULT]") {
        super(options);
        if (options.mocking) {
            this._mocking = true;
        }
        else {
            this.connect(options, name);
            abstracted_firebase_1.RealTimeDB.connection
                .ref(".info/connected")
                .on("value", this.monitorConnection.bind(this));
        }
    }
    waitForConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (abstracted_firebase_1.RealTimeDB.isConnected) {
                return Promise.resolve();
            }
            return new Promise(resolve => {
                const cb = () => {
                    resolve();
                };
                this._waitingForConnection.push(cb);
            });
        });
    }
    get isConnected() {
        return abstracted_firebase_1.RealTimeDB.isConnected;
    }
    monitorConnection(snap) {
        DB.isConnected = snap.val();
        this._waitingForConnection.forEach(cb => cb());
        this._waitingForConnection = [];
        if (DB.isConnected) {
            this._onConnected.forEach(listener => listener.cb(this));
        }
        else {
            this._onDisconnected.forEach(listener => listener.cb(this));
        }
    }
    connect(options, name = "[DEFAULT]") {
        if (!abstracted_firebase_1.RealTimeDB.isConnected) {
            const config = options.config || JSON.parse(process.env["FIREBASE_CONFIG"]);
            if (!config) {
                throw new Error("Trying to connect without firebase configuration!");
            }
            let app;
            try {
                app = firebase.initializeApp(config, name);
                const database = app.database();
                abstracted_firebase_1.RealTimeDB.connection = database;
                this.auth = app.auth(name);
            }
            catch (e) {
                if (e.message.indexOf("app/deplicate-app") !== -1) {
                    console.log(`Database named ${name} already exists `);
                }
                else {
                    console.log(`Error connecting to DB: ${e.message} `);
                    throw new Error(`Error connecting to DB: ${e.message}`);
                }
            }
            abstracted_firebase_1.RealTimeDB.isConnected = true;
        }
        if (options.debugging) {
            abstracted_firebase_1.RealTimeDB.connection.enableLogging(typeof options.debugging === "function"
                ? (message) => options.debugging(message)
                : (message) => console.log("[FIREBASE]", message));
        }
    }
}
exports.DB = DB;
