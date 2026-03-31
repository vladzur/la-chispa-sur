import { defineStore } from 'pinia';
import { ref } from 'vue';
import { onAuthStateChanged, type User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isAdmin = ref(false);
  const loading = ref(true);

  // Initialize Auth state listener
  const init = () => {
    onAuthStateChanged(auth, async (currentUser) => {
      user.value = currentUser;
      
      if (currentUser) {
        try {
          // Check if user has admin role in Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            isAdmin.value = true;
          } else {
            isAdmin.value = false;
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          isAdmin.value = false;
        }
      } else {
        isAdmin.value = false;
      }
      loading.value = false;
    });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return { user, isAdmin, loading, init, signOut };
});
