import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase/config';
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import { useAuthStore } from '../stores/auth';
import { getCurrentUser } from '../firebase/auth-helper';

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
      if (to.matched.some(record => record.meta.requiresAdmin)) {
         if (authStore.isAdmin) {
           next();
         } else {
           next({ name: 'home' })
         }
      } else {
         next();
      }
    }
  } else {
    next();
  }
});

router.afterEach((to) => {
  if (analytics) {
    logEvent(analytics, 'page_view', {
      page_path: to.path,
      page_location: window.location.href,
    });
  }
});

export default router;
