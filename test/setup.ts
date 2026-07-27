import { mock } from "bun:test";

// Mock the actual mongodb package to avoid V8 snapshot issues
mock.module("mongodb", () => {
  return {
    MongoClient: class {
      async connect() { return this; }
      db() {
        return {
          collection: () => ({
            insertOne: async () => ({ insertedId: "mock-id-123" }),
            find: () => ({ toArray: async () => [] }),
            findOne: async () => null,
            updateOne: async () => ({ modifiedCount: 1 }),
          })
        };
      }
    },
    ObjectId: class {
      constructor(id = "123456789012345678901234") {
        return id;
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
          find: mock(() => ({ toArray: mock(async () => []) })),
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
      }))
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
