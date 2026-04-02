import { defineStore } from 'pinia';
import { ref } from 'vue';
import { onAuthStateChanged, type User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isAdmin = ref(false);
  const userName = ref('');
  const loading = ref(true);

  // Initialize Auth state listener
  const init = () => {
    onAuthStateChanged(auth, async (currentUser) => {
      user.value = currentUser;
      
      if (currentUser) {
        try {
          // Check if user has admin role in Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            isAdmin.value = data.role === 'admin';
            userName.value = data.name || '';
          } else {
            isAdmin.value = false;
            userName.value = '';
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          isAdmin.value = false;
          userName.value = '';
        }
      } else {
        isAdmin.value = false;
        userName.value = '';
      }
      loading.value = false;
    });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return { user, isAdmin, userName, loading, init, signOut };
});
