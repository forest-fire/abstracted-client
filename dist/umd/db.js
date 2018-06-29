(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "abstracted-firebase", "./EventManager"], factory);
    }
})(function (require, exports) {
    "use strict";
    var __syncRequire = typeof module === "object" && typeof module.exports === "object";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable:whitespace
    const abstracted_firebase_1 = require("abstracted-firebase");
    const EventManager_1 = require("./EventManager");
    var FirebaseBoolean;
    (function (FirebaseBoolean) {
        FirebaseBoolean[FirebaseBoolean["true"] = 1] = "true";
        FirebaseBoolean[FirebaseBoolean["false"] = 0] = "false";
    })(FirebaseBoolean = exports.FirebaseBoolean || (exports.FirebaseBoolean = {}));
    class DB extends abstracted_firebase_1.RealTimeDB {
        /**
         * Instantiates a DB and then waits for the connection
         * to finish.
         */
        static async connect(config) {
            const obj = new DB(config);
            await obj.waitForConnection();
            return obj;
        }
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
            // cycle through temporary clients
            this._waitingForConnection.forEach(cb => cb());
            this._waitingForConnection = [];
            // call active listeners
            if (this.isConnected) {
                this._onConnected.forEach(listener => listener.cb(this));
            }
            else {
                this._onDisconnected.forEach(listener => listener.cb(this));
            }
        }
        /**
         * connect
         *
         * Asynchronously loads the firebase/app library and then
         * initializes a connection to the database.
         */
        async connectToFirebase(config) {
            if (!this.isConnected) {
                if (process.env["FIREBASE_CONFIG"]) {
                    config = Object.assign({}, config, JSON.parse(process.env["FIREBASE_CONFIG"]));
                }
                if (!config.apiKey || !config.authDomain || !config.databaseURL) {
                    throw new Error("Trying to connect without appropriate firebase configuration!");
                }
                const { name } = config;
                // tslint:disable-next-line:no-submodule-imports
                const firebase = await (__syncRequire ? Promise.resolve().then(() => require("firebase/app")) : new Promise((resolve_1, reject_1) => { require(["firebase/app"], resolve_1, reject_1); }));
                require("@firebase/database");
                try {
                    const runningApps = new Set(firebase.apps.map(i => i.name));
                    this.app = runningApps.has(name)
                        ? firebase.app()
                        : (this.app = firebase.initializeApp(config, name));
                    // this.enableDatabaseLogging = firebase.database.enableLogging.bind(
                    //   firebase.database
                    // );
                }
                catch (e) {
                    if (e.message && e.message.indexOf("app/duplicate-app") !== -1) {
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
            // TODO: relook at debugging func
            if (config.debugging) {
                this.enableDatabaseLogging(typeof config.debugging === "function"
                    ? (message) => config.debugging(message)
                    : (message) => console.log("[FIREBASE]", message));
            }
        }
        listenForConnectionStatus() {
            this._database.ref(".info/connected").on("value", this.monitorConnection.bind(this));
        }
    }
    exports.DB = DB;
});
