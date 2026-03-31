import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import { useAuthStore } from '../stores/auth';
import { getCurrentUser } from '../firebase/auth-helper'; // we'll create a helper to await user state

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/post/:id',
      name: 'post',
      component: () => import('../views/PostDetailView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminDashboardView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/editor/:id?',
      name: 'editor',
      component: () => import('../views/EditorView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    }
  ],
});

router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  if (requiresAuth) {
    const user = await getCurrentUser();
    if (!user) {
      next({ name: 'login' });
    } else {
      const authStore = useAuthStore();
      // By the time getCurrentUser resolves, auth store should ideally have resolved role
      // but to be safe, we check if isAdmin was set.
      // Wait a tick for the store to update if it hasn't
      if (to.matched.some(record => record.meta.requiresAdmin)) {
         if (authStore.isAdmin) {
           next();
         } else {
           next({ name: 'home' }) // or unauthorized page
         }
      } else {
         next();
      }
    }
  } else {
    next();
  }
});

export default router;
