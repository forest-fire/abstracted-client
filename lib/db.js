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
const abstracted_firebase_1 = require("abstracted-firebase");
const EventManager_1 = require("./EventManager");
var FirebaseBoolean;
(function (FirebaseBoolean) {
    FirebaseBoolean[FirebaseBoolean["true"] = 1] = "true";
    FirebaseBoolean[FirebaseBoolean["false"] = 0] = "false";
})(FirebaseBoolean = exports.FirebaseBoolean || (exports.FirebaseBoolean = {}));
class DB extends abstracted_firebase_1.RealTimeDB {
    constructor(config) {
        super();
        this._eventManager = new EventManager_1.EventManager();
        config = Object.assign({
            name: "[DEFAULT]"
        }, config);
        this.initialize(config);
    }
    get auth() {
        return abstracted_firebase_1._getFirebaseType(this, "auth");
    }
    get database() {
        return abstracted_firebase_1._getFirebaseType(this, "database");
    }
    get firestore() {
        return abstracted_firebase_1._getFirebaseType(this, "firestore");
    }
    get messaging() {
        return abstracted_firebase_1._getFirebaseType(this, "messaging");
    }
    get functions() {
        return abstracted_firebase_1._getFirebaseType(this, "functions");
    }
    get storage() {
        return abstracted_firebase_1._getFirebaseType(this, "storage");
    }
    monitorConnection(snap) {
        this._isConnected = snap.val();
        this._waitingForConnection.forEach(cb => cb());
        this._waitingForConnection = [];
        if (this.isConnected) {
            this._onConnected.forEach(listener => listener.cb(this));
        }
        else {
            this._onDisconnected.forEach(listener => listener.cb(this));
        }
    }
    connectToFirebase(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                if (process.env["FIREBASE_CONFIG"]) {
                    config = Object.assign({}, config, JSON.parse(process.env["FIREBASE_CONFIG"]));
                }
                if (!config.apiKey || !config.authDomain || !config.databaseURL) {
                    throw new Error("Trying to connect without appropriate firebase configuration!");
                }
                const { name } = config;
                const firebase = yield Promise.resolve().then(() => require("firebase/app"));
                try {
                    const runningApps = new Set(firebase.apps.map(i => i.name));
                    this.app = runningApps.has(name)
                        ? firebase.app()
                        : (this.app = firebase.initializeApp(config, name));
                    this.enableDatabaseLogging = firebase.database.enableLogging.bind(firebase.database);
                }
                catch (e) {
                    if (e.message && e.message.indexOf("app/duplicate-app") !== -1) {
                        console.log(JSON.stringify(e));
                        console.log(`The "${name}" app already exists; will proceed.`);
                        this._isConnected = true;
                    }
                    else {
                        throw e;
                    }
                }
                this._database = this.app.database();
                this._eventManager.connection(true);
            }
            if (config.debugging) {
                this.enableDatabaseLogging(typeof config.debugging === "function"
                    ? (message) => config.debugging(message)
                    : (message) => console.log("[FIREBASE]", message));
            }
        });
    }
    listenForConnectionStatus() {
        this._database.ref(".info/connected").on("value", this.monitorConnection.bind(this));
    }
}
exports.DB = DB;
