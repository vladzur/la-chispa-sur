// stores/auth.ts
// Pinia store para autenticación — migración de src/stores/auth.ts
// La store es isomórfica pero init() solo debe llamarse en el cliente
import { defineStore } from 'pinia'
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export type UserRole = 'admin' | 'editor' | 'pending' | null

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const role = ref<UserRole>(null)
  const userName = ref('')
  const loading = ref(true)

  // Computed desde el rol
  const isAdmin = computed(() => role.value === 'admin')
  const isEditor = computed(() => role.value === 'editor')
  const isPending = computed(() => role.value === 'pending')
  const isApproved = computed(() => role.value === 'admin' || role.value === 'editor')

  const _setRole = (r: UserRole) => { role.value = r }
  const _resetRole = () => { role.value = null }

  /**
   * Inicia el listener de Firebase Auth.
   * Solo llamar desde el cliente (ej. en layout default.vue onMounted).
   */
  const init = () => {
    const { $firebaseAuth, $firebaseDb } = useNuxtApp() as any

    onAuthStateChanged($firebaseAuth, async (currentUser) => {
      user.value = currentUser

      if (currentUser) {
        try {
          const userDoc = await getDoc(doc($firebaseDb, 'users', currentUser.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            _setRole(data.role as UserRole)
            userName.value = data.name || ''
          } else {
            _resetRole()
            userName.value = ''
          }
        } catch (error) {
          console.error('Error fetching user role:', error)
          _resetRole()
          userName.value = ''
        }
      } else {
        _resetRole()
        userName.value = ''
      }

      loading.value = false
    })
  }

  const signOut = async () => {
    const { $firebaseAuth } = useNuxtApp() as any
    await firebaseSignOut($firebaseAuth)
  }

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
  }
})
