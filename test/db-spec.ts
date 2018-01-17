// tslint:disable:no-implicit-dependencies
import DB from "../src/index";
import * as chai from "chai";
import { SchemaCallback } from "firemock";
import * as helpers from "./testing/helpers";
import { Database } from "@firebase/database";

const expect = chai.expect;
const config = {
  apiKey: "AIzaSyDuimhtnMcV1zeTl4m1MphOgWnzS17QhBM",
  authDomain: "abstracted-admin.firebaseapp.com",
  databaseURL: "https://abstracted-admin.firebaseio.com",
  projectId: "abstracted-admin",
  storageBucket: "abstracted-admin.appspot.com",
  messagingSenderId: "547394508788"
};

helpers.setupEnv();
describe("Connecting to Database", () => {
  it("can instantiate", () => {
    const db = new DB({ config });
    expect(db).to.be.an("object");
    expect(db).to.be.instanceof(DB);
    expect(db.getValue).to.be.a("function");
    expect(db.auth).to.be.an("object");
  });

  it("can get a value from database once waitForConnection() returns", async () => {
    const db = new DB({ config });
    const connected = (await db.getValue<boolean>(".info/connected"))
      ? true
      : false;
    await helpers.timeout(1);
    expect(connected).to.be.a("boolean");
    await db.waitForConnection();
    expect(db.isConnected).to.equal(true);
  });
});

describe("Read operations: ", () => {
  // tslint:disable-next-line:one-variable-per-declaration
  let db: DB;
  let dbMock: DB;
  const personMockGenerator: SchemaCallback = h => () => ({
    name: h.faker.name.firstName() + " " + h.faker.name.lastName(),
    age: h.faker.random.number({ min: 10, max: 99 })
  });
  before(async () => {
    db = new DB({ config });
    dbMock = new DB({ mocking: true });
    dbMock.mock.addSchema("person", personMockGenerator);
    await db.set("client-test-data", {
      one: "foo",
      two: "bar",
      three: "baz"
    });
    await db.set("client-test-records", {
      123456: {
        name: "Chris",
        age: 50
      },
      654321: {
        name: "Bob",
        age: 68
      }
    });
    await dbMock.mock.queueSchema("person", 20);
  });

  it("getSnapshot() gets statically set data in test DB", async () => {
    const data = await db.getSnapshot("client-test-data");
    expect(data.val()).to.be.an("object");
    expect(data.val().one).to.be.equal("foo");
    expect(data.val().two).to.be.equal("bar");
    expect(data.val().three).to.be.equal("baz");
    expect(data.key).to.equal("client-test-data");
  });

  it("getValue() gets statically set data in test DB", async () => {
    const data = await db.getValue("client-test-data");
    expect(data).to.be.an("object");
    expect(data.one).to.be.equal("foo");
    expect(data.two).to.be.equal("bar");
    expect(data.three).to.be.equal("baz");
  });

  it("getRecord() gets statically set data in test DB", async () => {
    interface ITest {
      id: string;
      age: number;
      name: string;
    }

    const record = await db.getRecord<ITest>("/client-test-records/123456");

    expect(record).to.be.an("object");
    expect(record.id).to.be.equal("123456");
    expect(record.name).to.be.equal("Chris");
    expect(record.age).to.be.equal(50);
  });
});

describe("Write Operations", () => {
  let db: DB;
  beforeEach(async () => {
    db = new DB({ config });
    await db.remove("client-test-data/pushed");
  });

  interface INameAndAge {
    name: string;
    age: number;
  }

  it("push() variables into database", async () => {
    await db.push<INameAndAge>("client-test-data/pushed", {
      name: "Charlie",
      age: 25
    });
    await db.push("client-test-data/pushed", {
      name: "Sandy",
      age: 32
    });
    const users = await db
      .getValue("client-test-data/pushed")
      .catch(e => new Error(e.message));
    expect(Object.keys(users).length).to.equal(2);
    expect(helpers.valuesOf(users, "name")).to.include("Charlie");
    expect(helpers.valuesOf(users, "name")).to.include("Sandy");
  });

  it("set() sets data at a given path in DB", async () => {
    await db.set<INameAndAge>("client-test-data/set/user", {
      name: "Charlie",
      age: 25
    });
    const user = await db.getValue<INameAndAge>("client-test-data/set/user");
    expect(user.name).to.equal("Charlie");
    expect(user.age).to.equal(25);
  });

  it('update() can "set" and then "update" contents', async () => {
    await db.update("client-test-data/update/user", {
      name: "Charlie",
      age: 25
    });
    let user = await db.getValue<INameAndAge>("client-test-data/update/user");
    expect(user.name).to.equal("Charlie");
    expect(user.age).to.equal(25);
    await db.update("client-test-data/update/user", {
      name: "Charles",
      age: 34
    });
    user = await db.getValue<INameAndAge>("client-test-data/update/user");
    expect(user.name).to.equal("Charles");
    expect(user.age).to.equal(34);
  });

  it("update() leaves unchanged attributes as they were", async () => {
    await db.update("client-test-data/update/user", {
      name: "Rodney",
      age: 25
    });
    let user = await db.getValue<INameAndAge>("client-test-data/update/user");
    expect(user.name).to.equal("Rodney");
    expect(user.age).to.equal(25);
    await db.update("client-test-data/update/user", {
      age: 34
    });
    user = await db.getValue<INameAndAge>("client-test-data/update/user");
    expect(user.name).to.equal("Rodney");
    expect(user.age).to.equal(34);
  });

  it("remove() eliminates a path -- and all children -- in DB", async () => {
    await db.set("client-test-data/removal/user", {
      name: "Rodney",
      age: 25
    });
    let user = await db.getValue<INameAndAge>("client-test-data/removal/user");
    expect(user.name).to.equal("Rodney");
    await db.remove("client-test-data/removal/user");
    user = await db.getValue<INameAndAge>("client-test-data/removal/user");
    expect(user).to.equal(null);
  });
});

describe("Other Operations", () => {
  let db: DB;
  beforeEach(async () => {
    db = new DB({ config });
  });

  it("exists() tests to true/false based on existance of data", async () => {
    await db.set("/client-test-data/existance", "foobar");
    let exists = await db.exists("/client-test-data/existance");
    expect(exists).to.equal(true);
    await db.remove("/client-test-data/existance");
    exists = await db.exists("/client-test-data/existance");
    expect(exists).to.equal(false);
  });
});
