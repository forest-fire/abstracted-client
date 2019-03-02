(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "abstracted-firebase", "./EventManager", "common-types"], factory);
    }
})(function (require, exports) {
    "use strict";
    var __syncRequire = typeof module === "object" && typeof module.exports === "object";
    Object.defineProperty(exports, "__esModule", { value: true });
    const abstracted_firebase_1 = require("abstracted-firebase");
    const EventManager_1 = require("./EventManager");
    const common_types_1 = require("common-types");
    var FirebaseBoolean;
    (function (FirebaseBoolean) {
        FirebaseBoolean[FirebaseBoolean["true"] = 1] = "true";
        FirebaseBoolean[FirebaseBoolean["false"] = 0] = "false";
    })(FirebaseBoolean = exports.FirebaseBoolean || (exports.FirebaseBoolean = {}));
    // export type FirebaseFunctions = import("@firebase/functions-types").FirebaseFunctions;
    class DB extends abstracted_firebase_1.RealTimeDB {
        constructor(config) {
            super();
            this._onConnected = [];
            this._onDisconnected = [];
            this._eventManager = new EventManager_1.EventManager();
            config = Object.assign({
                name: "[DEFAULT]"
            }, config);
            // this starts the "listenForConnectionStatus" event emitter
            this.initialize(config);
        }
        /**
         * Instantiates a DB and then waits for the connection
         * to finish.
         */
        static async connect(config) {
            const obj = await new DB(config);
            return obj;
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
        /**
         * get a notification when DB is connected; returns a unique id
         * which can be used to remove the callback. You may, optionally,
         * state a unique id of your own.
         */
        notifyWhenConnected(cb, id) {
            if (!id) {
                Math.random()
                    .toString(36)
                    .substr(2, 10);
            }
            else {
                if (this._onConnected.map(i => i.id).includes(id)) {
                    throw common_types_1.createError(`abstracted-client/duplicate-listener`, `Request for onConnect() notifications was done with an explicit key [ ${id} ] which is already in use!`);
                }
            }
            this._onConnected = this._onConnected.concat({ id, cb });
            return id;
        }
        /**
         * removes a callback notification previously registered
         */
        removeNotificationOnConnection(id) {
            this._onConnected = this._onConnected.filter(i => i.id !== id);
            return this;
        }
        /**
         * monitorConnection
         *
         * allows interested parties to hook into event messages when the
         * DB connection either connects or disconnects
         */
        _monitorConnection(snap) {
            this._isConnected = snap.val();
            console.log("monitoring", this._isConnected, this._waitingForConnection, this._onConnected);
            this._eventManager.connection(this._isConnected);
            // call active listeners
            if (this._isConnected) {
                this._isConnected = true;
                this._onConnected.forEach(listener => listener.cb(this));
            }
            else {
                this._isConnected = false;
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
            if (!this._isConnected) {
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
                    console.log("Running Apps: ", runningApps);
                    this.app = runningApps.has(name)
                        ? firebase.app() // TODO: does this connect to the right named DB?
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
            }
            else {
                console.info(`Database ${name} already connected`);
            }
            // TODO: relook at debugging func
            if (config.debugging) {
                this.enableDatabaseLogging(typeof config.debugging === "function"
                    ? (message) => config.debugging(message)
                    : (message) => console.log("[FIREBASE]", message));
            }
        }
        /**
         * Sets up the listening process for connection status
         */
        listenForConnectionStatus() {
            this._database.ref(".info/connected").on("value", this._monitorConnection.bind(this));
        }
    }
    exports.DB = DB;
});
