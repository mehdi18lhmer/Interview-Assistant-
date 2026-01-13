// MOCK IMPLEMENTATION TO PREVENT CRASH
// The real firebase-admin module fails to load without valid keys/environment.
// This allows the UI to render and "fake" auth for demonstration.

export const auth = {
  createSessionCookie: async () => "mock-session-cookie",
  verifySessionCookie: async () => ({
    uid: "mock-user-id",
    email: "demo@example.com",
    name: "Demo User",
  }),
  getUserByEmail: async () => ({
    uid: "mock-user-id",
    email: "demo@example.com",
  }),
} as any;

export const db = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => ({
        exists: false, // Simulate user not found so new one "creates"
        id: id || "mock-id",
        data: () => ({ name: "Demo User" }),
      }),
      set: async () => console.log(`[Mock DB] Saved to ${name}/${id}`),
    }),
    add: async (data: any) => {
      console.log(`[Mock DB] Added to ${name}`, data);
      return { id: "mock-doc-id" };
    },
    where: () => ({
      where: () => ({
        orderBy: () => ({
          get: async () => ({ docs: [], empty: true }),
        }),
        limit: () => ({
          get: async () => ({ docs: [], empty: true }),
        }),
        get: async () => ({ docs: [], empty: true }),
      }),
      orderBy: () => ({
        get: async () => ({ docs: [], empty: true }),
      }),
      limit: () => ({
        get: async () => ({ docs: [], empty: true }),
      }),
      get: async () => ({ docs: [], empty: true }),
    }),
    orderBy: () => ({
      where: () => ({
        where: () => ({
          limit: () => ({
            get: async () => ({ docs: [], empty: true }),
          }),
        }),
      }),
    }),
  }),
} as any;

