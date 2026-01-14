// This file handles Firebase Admin SDK initialization.
// We use a safe pattern that works during Next.js build and development.

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

// Check if we have the necessary environment variables for a real initialization
const hasRealConfig = !!(
  firebaseAdminConfig.projectId &&
  firebaseAdminConfig.clientEmail &&
  firebaseAdminConfig.privateKey
);

/**
 * Lazy-load the Firebase Admin SDK to prevent build errors
 */
async function getFirebaseAdmin() {
  if (!hasRealConfig || typeof window !== 'undefined') {
    return createMockAdmin();
  }

  try {
    const admin = await import("firebase-admin");
    
    // Ensure admin is defined (sometimes dynamic imports behave weirdly in SSR edges)
    if (!admin || !admin.apps) return createMockAdmin();

    if (admin.apps.length === 0) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(firebaseAdminConfig as any),
        });
      } catch (initError) {
        console.error("initializeApp error:", initError);
        return createMockAdmin();
      }
    }

    return {
      auth: admin.auth(),
      db: admin.firestore(),
    };
  } catch (error) {
    console.error("Firebase Admin module load failed:", error);
    return createMockAdmin();
  }
}

function createMockAdmin() {
  const mockAuth = {
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
  };

  const mockDb = {
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => ({
          exists: true,
          id: id || "mock-id",
          data: () => ({ name: "Demo User", email: "demo@example.com" }),
        }),
        set: async (data: any, options?: any) => ({ success: true }),
        update: async (data: any) => ({ success: true }),
      }),
      add: async (data: any) => ({ id: "mock-doc-id" }),
    }),
  };

  return { auth: mockAuth as any, db: mockDb as any };
}

/**
 * Export a wrapper that lazy-loads the functionality
 */
export const auth = {
  createSessionCookie: async (...args: any[]) => {
    const instance = await getFirebaseAdmin();
    return instance?.auth?.createSessionCookie ? await instance.auth.createSessionCookie(...args) : "mock-session-cookie";
  },
  verifySessionCookie: async (...args: any[]) => {
    const instance = await getFirebaseAdmin();
    return instance?.auth?.verifySessionCookie ? await instance.auth.verifySessionCookie(...args) : { uid: "mock", email: "mock", name: "Mock" };
  },
  getUserByEmail: async (...args: any[]) => {
    const instance = await getFirebaseAdmin();
    return instance?.auth?.getUserByEmail ? await instance.auth.getUserByEmail(...args) : null;
  },
} as any;

export const db = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => {
         const instance = await getFirebaseAdmin();
         return await instance.db.collection(name).doc(id).get();
      },
      set: async (...args: any[]) => {
         const instance = await getFirebaseAdmin();
         return await instance.db.collection(name).doc(id).set(...args);
      },
      update: async (...args: any[]) => {
         const instance = await getFirebaseAdmin();
         return await instance.db.collection(name).doc(id).update(...args);
      },
    }),
    add: async (...args: any[]) => {
       const instance = await getFirebaseAdmin();
       return await instance.db.collection(name).add(...args);
    },
  }),
} as any;
