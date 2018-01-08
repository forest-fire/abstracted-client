import { DB } from "./db";
export default DB;
export {
  DB,
  IFirebaseClientConfig,
  IFirebaseListener,
  FirebaseBoolean
} from "./db";

// tslint:disable-next-line:no-implicit-dependencies
export { DataSnapshot, Query, Reference, Database } from "@firebase/database";