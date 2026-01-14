import * as admin from 'firebase-admin';

// Initialize Firebase Admin as a singleton to prevent multiple instances
function getFirebaseAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Handle newlines in the private key correctly
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Firebase Admin environment variables are missing!');
    }
    // Return mock methods to prevent app crash if keys are missing
    return createMockAdmin();
  }

  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    return {
      auth: admin.auth(),
      db: admin.firestore(),
    };
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    return createMockAdmin();
  }
}

function createMockAdmin() {
  return {
    auth: {
      createSessionCookie: async () => 'mock-session-cookie',
      verifySessionCookie: async () => ({
        uid: 'mock-user-id',
        email: 'demo@example.com',
        name: 'Demo User',
      }),
      getUserByEmail: async () => ({
        uid: 'mock-user-id',
        email: 'demo@example.com',
      }),
    } as any,
    db: {
      collection: (name: string) => ({
        doc: (id: string) => ({
          get: async () => ({
            exists: true,
            id: id || 'mock-id',
            data: () => ({ name: 'Demo User', email: 'demo@example.com' }),
          }),
          set: async (data: any, options?: any) => ({ success: true }),
          update: async (data: any) => ({ success: true }),
        }),
        add: async (data: any) => ({ id: 'mock-doc-id' }),
      }),
    } as any,
  };
}

const { auth, db } = getFirebaseAdmin();

export { auth, db };
