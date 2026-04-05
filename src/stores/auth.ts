import { defineStore } from 'pinia';
import { ref } from 'vue';
import { onAuthStateChanged, type User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export type UserRole = 'admin' | 'editor' | 'pending' | null;

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const role = ref<UserRole>(null);
  const userName = ref('');
  const loading = ref(true);

  // Computed helpers (como propiedades derivadas del rol)
  const isAdmin = ref(false);
  const isEditor = ref(false);
  const isPending = ref(false);
  const isApproved = ref(false); // admin o editor

  const _setRole = (r: UserRole) => {
    role.value = r;
    isAdmin.value = r === 'admin';
    isEditor.value = r === 'editor';
    isPending.value = r === 'pending';
    isApproved.value = r === 'admin' || r === 'editor';
  };

  const _resetRole = () => {
    role.value = null;
    isAdmin.value = false;
    isEditor.value = false;
    isPending.value = false;
    isApproved.value = false;
  };

  // Initialize Auth state listener
  const init = () => {
    onAuthStateChanged(auth, async (currentUser) => {
      user.value = currentUser;

      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            _setRole(data.role as UserRole);
            userName.value = data.name || '';
          } else {
            _resetRole();
            userName.value = '';
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          _resetRole();
          userName.value = '';
        }
      } else {
        _resetRole();
        userName.value = '';
      }
      loading.value = false;
    });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return {
    user,
    role,
    isAdmin,
    isEditor,
    isPending,
    isApproved,
    userName,
    loading,
    init,
    signOut,
  };
});
