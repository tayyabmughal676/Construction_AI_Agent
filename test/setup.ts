import { mock } from "bun:test";

// Mock the actual mongodb package to avoid V8 snapshot issues
const createChainableFind = (results: any[] = []) => {
  const chainable = {
    limit: () => chainable,
    skip: () => chainable,
    sort: () => chainable,
    toArray: async () => results,
  };
  return chainable;
};

mock.module("mongodb", () => {
  return {
    MongoClient: class {
      async connect() { return this; }
      db() {
        return {
          collection: () => ({
            insertOne: async (data: any) => ({ insertedId: "mock-id-123", ...data }),
            find: () => createChainableFind([]),
            findOne: async () => null,
            updateOne: async () => ({ modifiedCount: 1 }),
          })
        };
      }
    },
    ObjectId: class MockObjectId {
      constructor(id = "123456789012345678901234") {
        return id;
      }
      static isValid(id: any): boolean {
        return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
      }
    }
  };
});

mock.module("../src/db/mongodb", () => {
  return {
    mongodb: {
      connect: mock(async () => console.log("Mock MongoDB connected")),
      getDb: mock(() => ({
        collection: mock(() => ({
          insertOne: mock(async (data: any) => ({ insertedId: "mock-id-123", ...data })),
          find: mock(() => createChainableFind([])),
          findOne: mock(async () => null),
          updateOne: mock(async () => ({ modifiedCount: 1 })),
        }))
      }))
    }
  };
});

// Mock Redis
mock.module("../src/db/redis", () => {
  return {
    redis: {
      connect: mock(async () => console.log("Mock Redis connected")),
      getClient: mock(() => ({
        get: mock(async () => null),
        set: mock(async () => "OK"),
        del: mock(async () => 1),
        ping: mock(async () => "PONG")
      })),
      healthCheck: mock(async () => true)
    }
  };
});

// Mock Logger to prevent test output spam
mock.module("../src/config/logger", () => {
  return {
    logger: {
      info: mock(() => {}),
      error: mock(() => {}),
      warn: mock(() => {}),
      debug: mock(() => {})
    }
  };
});
