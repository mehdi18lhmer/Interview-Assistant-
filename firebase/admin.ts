import * as admin from "firebase-admin";

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

function initializeFirebaseAdmin() {
  if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
    console.warn("Firebase Admin environment variables are missing. Falling back to mock mode.");
    
    // MOCK IMPLEMENTATION FOR DEMO/DEVELOPMENT
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

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseAdminConfig as any),
    });
  }

  return {
    auth: admin.auth(),
    db: admin.firestore(),
  };
}

const { auth, db } = initializeFirebaseAdmin();

export { auth, db };
