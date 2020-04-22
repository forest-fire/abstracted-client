(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "abstracted-firebase", "./EventManager", "./ClientError"], factory);
    }
})(function (require, exports) {
    "use strict";
    var __syncRequire = typeof module === "object" && typeof module.exports === "object";
    Object.defineProperty(exports, "__esModule", { value: true });
    const abstracted_firebase_1 = require("abstracted-firebase");
    const EventManager_1 = require("./EventManager");
    const ClientError_1 = require("./ClientError");
    var FirebaseBoolean;
    (function (FirebaseBoolean) {
        FirebaseBoolean[FirebaseBoolean["true"] = 1] = "true";
        FirebaseBoolean[FirebaseBoolean["false"] = 0] = "false";
    })(FirebaseBoolean = exports.FirebaseBoolean || (exports.FirebaseBoolean = {}));
    exports.MOCK_LOADING_TIMEOUT = 200;
    class DB extends abstracted_firebase_1.RealTimeDB {
        constructor(config) {
            super(config);
            this._clientType = "client";
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
            const fb = await (__syncRequire ? Promise.resolve().then(() => require("@firebase/app")) : new Promise((resolve_1, reject_1) => { require(["@firebase/app"], resolve_1, reject_1); }));
            await (__syncRequire ? Promise.resolve().then(() => require("@firebase/database")) : new Promise((resolve_2, reject_2) => { require(["@firebase/database"], resolve_2, reject_2); }));
            return Array.from(new Set(fb.firebase.apps.map((i) => i.name)));
        }
        /**
         * access to provider specific providers
         */
        get authProviders() {
            if (!this._fbClass) {
                throw new ClientError_1.ClientError(`There was a problem getting the Firebase default export/class!`);
            }
            if (!this._authProviders) {
                if (!this._fbClass.auth) {
                    throw new ClientError_1.ClientError(`Attempt to get the authProviders getter before connecting to the database!`);
                }
                this._authProviders = this._fbClass.auth;
            }
            return this._authProviders;
        }
        async auth() {
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
            this._auth = this.app.auth();
            return this._auth;
        }
        /**
         * connect
         *
         * Asynchronously loads the firebase/app library and then
         * initializes a connection to the database.
         */
        async connectToFirebase(config, useAuth = true) {
            if (abstracted_firebase_1.isMockConfig(config)) {
                // MOCK DB
                await this.getFireMock({
                    db: config.mockData || {},
                    auth: Object.assign({ providers: [] }, config.mockAuth),
                });
                this._authProviders = this._mock.authProviders;
                this._isConnected = true;
            }
            else {
                // REAL DB
                if (!this._isConnected) {
                    if (process.env["FIREBASE_CONFIG"]) {
                        config = Object.assign(Object.assign({}, config), JSON.parse(process.env["FIREBASE_CONFIG"]));
                    }
                    config = config;
                    if (!config.apiKey || !config.authDomain || !config.databaseURL) {
                        throw new Error("Trying to connect without appropriate firebase configuration!");
                    }
                    config.name = config.name || config.databaseURL.replace(/.*https:\W*([\w-]*)\.((.|\n)*)/g, "$1");
                    // tslint:disable-next-line:no-submodule-imports
                    const fb = await (__syncRequire ? Promise.resolve().then(() => require(/* webpackChunkName: "firebase-app" */ "@firebase/app")) : new Promise((resolve_3, reject_3) => { require(["@firebase/app"], resolve_3, reject_3); }));
                    await (__syncRequire ? Promise.resolve().then(() => require(/* webpackChunkName: "firebase-db" */ "@firebase/database")) : new Promise((resolve_4, reject_4) => { require(["@firebase/database"], resolve_4, reject_4); }));
                    if (useAuth) {
                        await (__syncRequire ? Promise.resolve().then(() => require(/* webpackChunkName: "firebase-auth" */ "@firebase/auth")) : new Promise((resolve_5, reject_5) => { require(["@firebase/auth"], resolve_5, reject_5); }));
                    }
                    try {
                        const runningApps = new Set(fb.firebase.apps.map((i) => i.name));
                        this.app = runningApps.has(config.name)
                            ? // TODO: does this connect to the right named DB?
                                fb.firebase.app(config.name)
                            : fb.firebase.initializeApp(config, config.name);
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
                    this._fbClass = fb.default;
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
        }
        /**
         * Sets up the listening process for connection status
         */
        listenForConnectionStatus() {
            if (!this._mocking) {
                this._database.ref(".info/connected").on("value", (snap) => this._monitorConnection.bind(this)(snap));
            }
            else {
                // console.info(`Listening for connection changes on Mock DB`);
            }
        }
    }
    exports.DB = DB;
});
