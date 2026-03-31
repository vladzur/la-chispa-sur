import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './config';
import { useAuthStore } from '../stores/auth';

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      
      // Wait for authStore to reflect the user's role if user exists
      if (user) {
        const authStore = useAuthStore();
        if (authStore.user?.uid !== user.uid || authStore.loading) {
          // If the store hasn't initialized the role query yet, wait for it
          // We can just call init() or wait. For simplicity, we can let the store handle it 
          // but we return the user. The router will check authStore.isAdmin
          // To ensure the store is resolved, we could await checking the role here.
          // By calling authStore.init() at app startup, the store listener will be active.
          
          await new Promise<void>(res => {
            const check = setInterval(() => {
              if (!authStore.loading) {
                clearInterval(check);
                res();
              }
            }, 50);
          });
        }
      }
      resolve(user);
    }, reject);
  });
};
