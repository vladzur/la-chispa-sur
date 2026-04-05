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
    // ── Registro por invitación (ruta secreta, sin menú) ─────────────────────
    {
      path: '/registro/:token',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { guestOnly: true }, // Redirige a home si ya está logueado
    },
    // ── Pantalla de espera para usuarios pendientes ──────────────────────────
    {
      path: '/pendiente',
      name: 'pending-approval',
      component: () => import('../views/PendingApprovalView.vue'),
      meta: { requiresAuth: true },
    },
    // ── Panel admin (solo admin) ──────────────────────────────────────────────
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminDashboardView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    // ── Editor de noticias (admin o editor aprobado) ─────────────────────────
    {
      path: '/admin/editor/:id?',
      name: 'editor',
      component: () => import('../views/EditorView.vue'),
      meta: { requiresAuth: true, requiresApproved: true },
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const guestOnly = to.matched.some(record => record.meta.guestOnly);

  // Esperar a que el usuario esté disponible
  const user = await getCurrentUser();
  const authStore = useAuthStore();

  // Si la ruta es solo para invitados (registro) y el usuario está logueado,
  // redirigir según su rol
  if (guestOnly && user) {
    if (authStore.isPending) {
      return next({ name: 'pending-approval' });
    }
    return next({ name: 'home' });
  }

  if (!requiresAuth) {
    return next();
  }

  // Requiere autenticación
  if (!user) {
    return next({ name: 'login' });
  }

  // Usuario pendiente: solo puede ir a /pendiente
  if (authStore.isPending && to.name !== 'pending-approval') {
    return next({ name: 'pending-approval' });
  }

  // Solo admin
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    return authStore.isAdmin ? next() : next({ name: 'home' });
  }

  // Admin o editor aprobado
  if (to.matched.some(record => record.meta.requiresApproved)) {
    return authStore.isApproved ? next() : next({ name: 'home' });
  }

  next();
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
