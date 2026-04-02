import { vi } from 'vitest';

// Simular el sessionStorage para JSDOM si no lo tiene configurado completo
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock para firebase/app
vi.mock('firebase/app', () => {
  return {
    initializeApp: vi.fn(),
  };
});

// Mock para firebase/auth
vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn(() => ({ currentUser: null })),
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(),
  };
});

// Mock para firebase/firestore
vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    doc: vi.fn(() => ({ id: 'mocked-doc-id' })),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    serverTimestamp: vi.fn(() => 'mocked-timestamp'),
    increment: vi.fn((n: number) => ({ __increment: n })),
  };
});


// Mock para configuración local
vi.mock('../firebase/config', () => {
  return {
    auth: { currentUser: null },
    db: {},
    storage: {},
  };
});
