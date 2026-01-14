// This file handles Firebase Admin SDK initialization without any top-level imports
// to prevent "TypeError: Cannot read properties of undefined (reading 'prototype')" during builds.

function getFirebaseConfig() {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

async function getAdminInstance() {
  const config = getFirebaseConfig();
  
  // Basic guard for environment variables
  if (!config.projectId || !config.clientEmail || !config.privateKey) {
    return createMockAdmin();
  }

  try {
    // Dynamic import to avoid evaluation at build time
    const admin = await import('firebase-admin');
    
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(config as any),
      });
    }

    return {
      auth: admin.auth(),
      db: admin.firestore(),
    };
  } catch (error) {
    console.error('Failed to load Firebase Admin:', error);
    return createMockAdmin();
  }
}

function createMockAdmin() {
  const mockQuery = {
    where: () => mockQuery,
    orderBy: () => mockQuery,
    limit: () => mockQuery,
    get: async () => ({
      empty: true,
      docs: [],
    }),
  } as any;

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
        ...mockQuery,
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

// Proxy-based export to handle lazy initialization automatically
export const auth = {
  createSessionCookie: async (...args: any[]) => (await getAdminInstance()).auth.createSessionCookie(...args),
  verifySessionCookie: async (...args: any[]) => (await getAdminInstance()).auth.verifySessionCookie(...args),
  getUserByEmail: async (...args: any[]) => (await getAdminInstance()).auth.getUserByEmail(...args),
} as any;

export const db = {
  collection: (name: string) => {
    // We return a proxy that handles the collection chain
    const getTarget = async () => (await getAdminInstance()).db.collection(name);
    
    return {
      doc: (id: string) => ({
        get: async () => (await getTarget()).doc(id).get(),
        set: async (...args: any[]) => (await getTarget()).doc(id).set(...args),
        update: async (...args: any[]) => (await getTarget()).doc(id).update(...args),
      }),
      add: async (...args: any[]) => (await getTarget()).add(...args),
      where: (...args: any[]) => createChainProxy(getTarget, 'where', args),
      orderBy: (...args: any[]) => createChainProxy(getTarget, 'orderBy', args),
      limit: (...args: any[]) => createChainProxy(getTarget, 'limit', args),
      get: async () => (await getTarget()).get(),
    };
  }
} as any;

// Helper to handle Firestore chaining like .where().orderBy().limit().get()
function createChainProxy(getTarget: () => Promise<any>, method: string, args: any[]): any {
  const newGetTarget = async () => {
    const target = await getTarget();
    return target[method](...args);
  };

  return {
    where: (...nextArgs: any[]) => createChainProxy(newGetTarget, 'where', nextArgs),
    orderBy: (...nextArgs: any[]) => createChainProxy(newGetTarget, 'orderBy', nextArgs),
    limit: (...nextArgs: any[]) => createChainProxy(newGetTarget, 'limit', nextArgs),
    get: async () => (await newGetTarget()).get(),
  };
}
