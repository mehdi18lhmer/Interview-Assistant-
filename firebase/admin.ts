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
  if (!hasRealConfig) {
    // Return mock mode immediately if config is missing
    return createMockAdmin();
  }

  try {
    const admin = await import("firebase-admin");
    
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseAdminConfig as any),
      });
    }

    return {
      auth: admin.auth(),
      db: admin.firestore(),
    };
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
    return createMockAdmin();
  }
}

function createMockAdmin() {
  return {
    auth: {
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
    } as any,
    db: {
      collection: (name: string) => ({
        doc: (id: string) => ({
          get: async () => ({
            exists: true,
            id: id || "mock-id",
            data: () => ({ name: "Demo User", email: "demo@example.com" }),
          }),
          set: async (data: any, options?: any) => {
            console.log(`[Mock DB] Set ${name}/${id}`, data, options);
            return { success: true };
          },
          update: async (data: any) => {
            console.log(`[Mock DB] Update ${name}/${id}`, data);
            return { success: true };
          },
        }),
        add: async (data: any) => {
          console.log(`[Mock DB] Add to ${name}`, data);
          return { id: "mock-doc-id" };
        },
      }),
    } as any,
  };
}

/**
 * Export a wrapper that lazy-loads the functionality
 */
export const auth = {
  createSessionCookie: async (...args: any[]) => (await getFirebaseAdmin()).auth.createSessionCookie(...args),
  verifySessionCookie: async (...args: any[]) => (await getFirebaseAdmin()).auth.verifySessionCookie(...args),
  getUserByEmail: async (...args: any[]) => (await getFirebaseAdmin()).auth.getUserByEmail(...args),
} as any;

export const db = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => (await getFirebaseAdmin()).db.collection(name).doc(id).get(),
      set: async (...args: any[]) => (await getFirebaseAdmin()).db.collection(name).doc(id).set(...args),
      update: async (...args: any[]) => (await getFirebaseAdmin()).db.collection(name).doc(id).update(...args),
    }),
    add: async (...args: any[]) => (await getFirebaseAdmin()).db.collection(name).add(...args),
  }),
} as any;
