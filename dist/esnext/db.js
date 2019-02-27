import { RealTimeDB, _getFirebaseType } from "abstracted-firebase";
import { EventManager } from "./EventManager";
export var FirebaseBoolean;
(function (FirebaseBoolean) {
    FirebaseBoolean[FirebaseBoolean["true"] = 1] = "true";
    FirebaseBoolean[FirebaseBoolean["false"] = 0] = "false";
})(FirebaseBoolean || (FirebaseBoolean = {}));
export class DB extends RealTimeDB {
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
        this._eventManager = new EventManager();
        config = Object.assign({
            name: "[DEFAULT]"
        }, config);
        this.initialize(config);
    }
    get auth() {
        return _getFirebaseType(this, "auth");
    }
    get database() {
        return _getFirebaseType(this, "database");
    }
    get firestore() {
        return _getFirebaseType(this, "firestore");
    }
    get messaging() {
        return _getFirebaseType(this, "messaging");
    }
    get functions() {
        return _getFirebaseType(this, "functions");
    }
    get storage() {
        return _getFirebaseType(this, "storage");
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
            const firebase = await import("firebase/app");
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
            await this.waitForConnection();
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
