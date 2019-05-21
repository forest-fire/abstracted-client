import { RealTimeDB, isMockConfig } from "abstracted-firebase";
import { EventManager } from "./EventManager";
export var FirebaseBoolean;
(function (FirebaseBoolean) {
    FirebaseBoolean[FirebaseBoolean["true"] = 1] = "true";
    FirebaseBoolean[FirebaseBoolean["false"] = 0] = "false";
})(FirebaseBoolean || (FirebaseBoolean = {}));
export let MOCK_LOADING_TIMEOUT = 200;
export class DB extends RealTimeDB {
    constructor(config) {
        super(config);
        this._clientType = "client";
        this._eventManager = new EventManager();
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
        const fb = await import("@firebase/app");
        await import("@firebase/database");
        return Array.from(new Set(fb.firebase.apps.map(i => i.name)));
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
        await import(/* webpackChunkName: "firebase-auth" */ "@firebase/auth");
        this._auth = this.app.auth();
        return this._auth;
    }
    /**
     * connect
     *
     * Asynchronously loads the firebase/app library and then
     * initializes a connection to the database.
     */
    async connectToFirebase(config) {
        if (isMockConfig(config)) {
            // MOCK DB
            await this.getFireMock({ db: config.mockData || {}, auth: config.mockAuth || {} });
            this._isConnected = true;
        }
        else {
            // REAL DB
            if (!this._isConnected) {
                if (process.env["FIREBASE_CONFIG"]) {
                    config = Object.assign({}, config, JSON.parse(process.env["FIREBASE_CONFIG"]));
                }
                config = config;
                if (!config.apiKey || !config.authDomain || !config.databaseURL) {
                    throw new Error("Trying to connect without appropriate firebase configuration!");
                }
                config.name =
                    config.name ||
                        config.databaseURL.replace(/.*https:\W*([\w-]*)\.((.|\n)*)/g, "$1");
                // tslint:disable-next-line:no-submodule-imports
                const fb = await import(/* webpackChunkName: "firebase-app" */ "@firebase/app");
                await import(/* webpackChunkName: "firebase-db" */ "@firebase/database");
                try {
                    const runningApps = new Set(fb.firebase.apps.map(i => i.name));
                    this.app = runningApps.has(config.name)
                        ? fb.firebase.app(config.name) // TODO: does this connect to the right named DB?
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
            this._database
                .ref(".info/connected")
                .on("value", this._monitorConnection.bind(this));
        }
    }
}
