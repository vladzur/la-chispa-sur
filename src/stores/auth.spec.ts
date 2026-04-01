import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './auth';

// Imports directly from mocked modules
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.isAdmin).toBe(false);
    expect(store.loading).toBe(true);
  });

  it('updates state to logged in without admin role', async () => {
    const store = useAuthStore();

    // Mock Firestore getDoc to return non-admin user
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ role: 'user' })
    });

    // Simulate calling init
    store.init();

    // Extract the callback registered to onAuthStateChanged
    const callback = (onAuthStateChanged as any).mock.calls[0][1];
    
    // Simulate Firebase firing auth state changed with a user
    const fakeUser = { uid: 'user123', email: 'test@test.com' };
    await callback(fakeUser);

    expect(store.user).toEqual(fakeUser);
    expect(store.isAdmin).toBe(false);
    expect(store.loading).toBe(false);
  });

  it('updates state and flags isAdmin true for admin role', async () => {
    const store = useAuthStore();

    // Mock Firestore getDoc to return admin user
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ role: 'admin' })
    });

    store.init();

    const callback = (onAuthStateChanged as any).mock.calls[0][1];
    const fakeUser = { uid: 'admin999', email: 'admin@chispa.com' };
    await callback(fakeUser);

    expect(store.user).toEqual(fakeUser);
    expect(store.isAdmin).toBe(true); // Should be true now
    expect(store.loading).toBe(false);
  });

  it('calls firebase signOut when store.signOut is invoked', async () => {
    const store = useAuthStore();
    await store.signOut();
    expect(firebaseSignOut).toHaveBeenCalled();
  });
});
