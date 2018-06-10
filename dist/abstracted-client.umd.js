(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('events'), require('abstracted-firebase'), require('@firebase/database')) :
    typeof define === 'function' && define.amd ? define(['exports', 'events', 'abstracted-firebase', '@firebase/database'], factory) :
    (factory((global.AbstractedClient = {}),global.EventEmitter,global.abstractedFirebase,global.database));
}(this, (function (exports,EventEmitter,abstractedFirebase,database) { 'use strict';

    // import EventEmitter = require("events");
    class EventManager extends EventEmitter {
        connection(state) {
            this.emit("connection", state);
        }
    }

    // tslint:disable:whitespace
    (function (FirebaseBoolean) {
        FirebaseBoolean[FirebaseBoolean["true"] = 1] = "true";
        FirebaseBoolean[FirebaseBoolean["false"] = 0] = "false";
    })(exports.FirebaseBoolean || (exports.FirebaseBoolean = {}));
    class DB extends abstractedFirebase.RealTimeDB {
        constructor(config) {
            super();
            this._eventManager = new EventManager();
            config = Object.assign({
                name: "[DEFAULT]"
            }, config);
            this.initialize(config);
        }
        get auth() {
            return abstractedFirebase._getFirebaseType(this, "auth");
        }
        get database() {
            return abstractedFirebase._getFirebaseType(this, "database");
        }
        get firestore() {
            return abstractedFirebase._getFirebaseType(this, "firestore");
        }
        get messaging() {
            return abstractedFirebase._getFirebaseType(this, "messaging");
        }
        get functions() {
            return abstractedFirebase._getFirebaseType(this, "functions");
        }
        get storage() {
            return abstractedFirebase._getFirebaseType(this, "storage");
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

    exports.DataSnapshot = database.DataSnapshot;
    exports.Query = database.Query;
    exports.Reference = database.Reference;
    exports.Database = database.Database;
    exports.default = DB;
    exports.DB = DB;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=abstracted-client.umd.js.map
