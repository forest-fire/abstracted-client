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
    const MOCK_LOADING_TIMEOUT = 200;
    class DB extends abstracted_firebase_1.RealTimeDB {
        constructor(config) {
            super();
            this._onConnected = [];
            this._onDisconnected = [];
            this._eventManager = new EventManager_1.EventManager();
            // this starts the "listenForConnectionStatus" event emitter
            this.initialize(config);
        }
        /**
         * Instantiates a DB and then waits for the connection
         * to finish.
         */
        static async connect(config) {
            const obj = new DB(config);
            await obj.waitForConnection();
            return obj;
        }
        /** lists the database names which are currently connected */
        static async connectedTo() {
            // tslint:disable-next-line:no-submodule-imports
            const firebase = await (__syncRequire ? Promise.resolve().then(() => require("firebase/app")) : new Promise((resolve_1, reject_1) => { require(["firebase/app"], resolve_1, reject_1); }));
            await (__syncRequire ? Promise.resolve().then(() => require("@firebase/database")) : new Promise((resolve_2, reject_2) => { require(["@firebase/database"], resolve_2, reject_2); }));
            return Array.from(new Set(firebase.apps.map(i => i.name)));
        }
        async auth() {
            if (this._auth) {
                return this._auth;
            }
            if (!this.isConnected) {
                await this.waitForConnection();
            }
            await (__syncRequire ? Promise.resolve().then(() => require("@firebase/auth")) : new Promise((resolve_3, reject_3) => { require(["@firebase/auth"], resolve_3, reject_3); }));
            this._auth = this.app.auth();
            return this._auth;
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
         * Provides a promise-based way of waiting for the connection to be
         * established before resolving
         */
        async waitForConnection() {
            if (this._mocking) {
                // MOCKING
                if (this._mockLoadingState === "loaded") {
                    return;
                }
                const timeout = new Date().getTime() + MOCK_LOADING_TIMEOUT;
                while (this._mockLoadingState === "loading" && new Date().getTime() < timeout) {
                    await common_types_1.wait(1);
                }
            }
            else {
                // NON-MOCKING
                if (this._isConnected) {
                    return;
                }
                const connectionEvent = async () => {
                    return new Promise((resolve, reject) => {
                        this._eventManager.once("connection", (state) => {
                            if (state) {
                                resolve();
                            }
                            else {
                                throw common_types_1.createError("abstracted-client/disconnected-while-connecting", `While waiting for connection received a disconnect message`);
                            }
                        });
                    });
                };
                const timeout = async () => {
                    await common_types_1.wait(this.CONNECTION_TIMEOUT);
                    throw common_types_1.createError("abstracted-client/connection-timeout", `The database didn't connect after the allocated period of ${this.CONNECTION_TIMEOUT}ms`);
                };
                try {
                    await Promise.race([connectionEvent(), timeout()]);
                }
                catch (e) {
                    throw e;
                }
                this._isConnected = true;
                return this;
            }
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
            // call active listeners
            if (this._isConnected) {
                this._eventManager.connection(this._isConnected);
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
            if (!this._isConnected) {
                if (process.env["FIREBASE_CONFIG"]) {
                    config = Object.assign({}, config, JSON.parse(process.env["FIREBASE_CONFIG"]));
                }
                if (!config.apiKey || !config.authDomain || !config.databaseURL) {
                    throw new Error("Trying to connect without appropriate firebase configuration!");
                }
                config.name =
                    config.name ||
                        config.databaseURL.replace(/.*https:\W*([\w-]*)\.((.|\n)*)/g, "$1");
                // tslint:disable-next-line:no-submodule-imports
                const firebase = await (__syncRequire ? Promise.resolve().then(() => require("firebase/app")) : new Promise((resolve_4, reject_4) => { require(["firebase/app"], resolve_4, reject_4); }));
                await (__syncRequire ? Promise.resolve().then(() => require("@firebase/database")) : new Promise((resolve_5, reject_5) => { require(["@firebase/database"], resolve_5, reject_5); }));
                try {
                    const runningApps = new Set(firebase.apps.map(i => i.name));
                    this.app = runningApps.has(config.name)
                        ? firebase.app(config.name) // TODO: does this connect to the right named DB?
                        : firebase.initializeApp(config, config.name);
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
                console.info(`Database ${config.name} already connected`);
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
