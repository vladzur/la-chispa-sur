// composables/useAuthFetch.ts
import { useAuthStore } from '~/stores/auth'

export const useAuthFetch = async <T = any>(request: string, opts?: any): Promise<T> => {
  const authStore = useAuthStore()
  let token = ''

  if (import.meta.client && authStore.user) {
    try {
      token = await authStore.user.getIdToken()
    } catch (e) {
      console.warn('Error obteniendo Firebase token', e)
    }
  }

  const options = opts || {}
  
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  }

  return $fetch<T>(request, options) as Promise<T>
}
