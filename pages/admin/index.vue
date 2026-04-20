<!-- pages/admin/index.vue — Dashboard principal (admin y editores aprobados) -->
<template>
  <div class="dashboard-wrapper">
    <!-- Tabs de navegación -->
    <div class="tabs-header">
      <button
        id="tab-posts"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'posts' }"
        @click="activeTab = 'posts'"
      >
        📰 Noticias
      </button>
      <button
        v-if="authStore.isAdmin"
        id="tab-editors"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'editors' }"
        @click="activeTab = 'editors'; loadEditors()"
      >
        👥 Editores
        <span v-if="pendingCount > 0" class="badge-count">{{ pendingCount }}</span>
      </button>
    </div>

    <!-- ─── TAB: NOTICIAS ───────────────────────────────────────────────────── -->
    <div v-show="activeTab === 'posts'" class="tab-content">
      <div class="section-header">
        <h1 class="section-title">Noticias Publicadas</h1>
        <NuxtLink to="/admin/editor" class="btn-primary">+ Redactar</NuxtLink>
      </div>

      <div v-if="postsLoading" class="loading-state">
        <div class="spinner"></div>
      </div>
      <div v-else-if="posts.length === 0" class="empty-state">
        <p class="empty-text">No hay noticias publicadas aún.</p>
        <NuxtLink to="/admin/editor" class="link">Comienza a redactar aquí</NuxtLink>
      </div>
      <div v-else class="list-card">
        <ul class="list">
          <li v-for="post in posts" :key="post.id" class="list-item">
            <div class="list-item__info">
              <div class="list-item__title-row">
                <span class="list-item__title">{{ post.title }}</span>
                <span v-if="post.published === false" class="badge badge--draft">Borrador</span>
              </div>
              <span class="list-item__meta">{{ formatDate(post.createdAt) }}</span>
            </div>
            <div class="list-item__actions">
              <NuxtLink :to="`/post/${post.slug || post.id}`" target="_blank" class="action-link action-link--view">Ver</NuxtLink>
              <NuxtLink :to="`/admin/editor/${post.id}`" class="action-link action-link--edit">Editar</NuxtLink>
              <button id="btn-delete-post" @click="handleDelete(post.id)" class="action-link action-link--delete">Borrar</button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- ─── TAB: EDITORES (solo admin) ─────────────────────────────────────── -->
    <div v-if="authStore.isAdmin" v-show="activeTab === 'editors'" class="tab-content">

      <!-- Generador de invitación -->
      <div class="invite-card">
        <div class="invite-card__header">
          <div>
            <h2 class="invite-card__title">Enlace de invitación</h2>
            <p class="invite-card__desc">Genera un enlace único (válido 72 horas) para invitar a un nuevo editor.</p>
          </div>
          <button
            id="btn-generate-invite"
            class="btn-primary"
            @click="handleGenerateInvite"
            :disabled="generatingInvite"
          >
            <span v-if="generatingInvite" class="btn-spinner-inline"></span>
            {{ generatingInvite ? 'Generando...' : '🔗 Generar enlace' }}
          </button>
        </div>

        <div v-if="generatedLink" class="invite-link-box">
          <div class="invite-link-row">
            <span class="invite-link-text">{{ generatedLink }}</span>
            <button id="btn-copy-invite" class="btn-copy" @click="copyLink">
              {{ copied ? '✅ Copiado' : '📋 Copiar' }}
            </button>
          </div>
          <p class="invite-link-note">⏱️ Este enlace expira en 72 horas y es de un solo uso.</p>
        </div>
      </div>

      <!-- Solicitudes pendientes -->
      <div class="editors-section">
        <h2 class="section-title">
          Solicitudes pendientes
          <span v-if="pendingUsers.length > 0" class="badge-count badge-count--inline">{{ pendingUsers.length }}</span>
        </h2>

        <div v-if="editorsLoading" class="loading-state"><div class="spinner"></div></div>
        <div v-else-if="pendingUsers.length === 0" class="empty-state">
          <p class="empty-text">No hay solicitudes pendientes.</p>
        </div>
        <div v-else class="list-card">
          <ul class="list">
            <li v-for="user in pendingUsers" :key="user.uid" class="list-item">
              <div class="list-item__info">
                <span class="list-item__title">{{ user.name }}</span>
                <span class="list-item__meta">{{ user.email }}</span>
                <span class="list-item__meta">Solicitó: {{ formatDate(user.createdAt) }}</span>
              </div>
              <div class="list-item__actions">
                <button class="action-link action-link--approve" :disabled="actionLoading === user.uid" @click="handleApprove(user.uid)">
                  {{ actionLoading === user.uid ? '...' : '✅ Aprobar' }}
                </button>
                <button class="action-link action-link--delete" :disabled="actionLoading === user.uid" @click="handleReject(user.uid)">
                  {{ actionLoading === user.uid ? '...' : '❌ Rechazar' }}
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Editores activos -->
      <div class="editors-section">
        <h2 class="section-title">Editores activos</h2>

        <div v-if="editorsLoading" class="loading-state"><div class="spinner"></div></div>
        <div v-else-if="activeEditors.length === 0" class="empty-state">
          <p class="empty-text">No hay editores activos aún.</p>
        </div>
        <div v-else class="list-card">
          <ul class="list">
            <li v-for="editor in activeEditors" :key="editor.uid" class="list-item">
              <div class="list-item__info">
                <span class="list-item__title">{{ editor.name }}</span>
                <span class="list-item__meta">{{ editor.email }}</span>
                <span class="list-item__meta">Aprobado: {{ editor.approvedAt ? formatDate(editor.approvedAt) : '—' }}</span>
              </div>
              <div class="list-item__actions">
                <button class="action-link action-link--edit" :disabled="actionLoading === editor.uid" @click="handleRevoke(editor.uid)">
                  {{ actionLoading === editor.uid ? '...' : '⏸ Revocar' }}
                </button>
                <button class="action-link action-link--delete" :disabled="actionLoading === editor.uid" @click="handleDeleteEditor(editor.uid)">
                  {{ actionLoading === editor.uid ? '...' : '🗑 Eliminar' }}
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types/post'

// ── Auth guard — solo editores aprobados ─────────────────────────────────────
definePageMeta({
  layout: 'default',
  middleware: 'auth',
  meta: { requiresAuth: true, requiresApproved: true },
})

useSeoMeta({ title: 'Panel de administración', robots: 'noindex' })

const authStore = useAuthStore()

// ── TAB: Noticias ─────────────────────────────────────────────────────────────
const activeTab = ref<'posts' | 'editors'>('posts')
const posts = ref<Post[]>([])
const postsLoading = ref(true)

const loadPosts = async () => {
  postsLoading.value = true
  try {
    // Usar la API route — incluye borradores para el admin
    const all = await useAuthFetch<Post[]>('/api/posts/all')
    posts.value = all
  } catch {
    posts.value = []
  } finally {
    postsLoading.value = false
  }
}

onMounted(loadPosts)

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(iso))
}

const handleDelete = async (id: string) => {
  if (!confirm('¿Estás seguro de que quieres borrar esta noticia?')) return
  await useAuthFetch(`/api/posts/${id}`, { method: 'DELETE' })
  await loadPosts()
}

// ── TAB: Editores ─────────────────────────────────────────────────────────────
interface EditorUser { uid: string; name: string; email: string; role: string; createdAt: string; approvedAt?: string }

const pendingUsers = ref<EditorUser[]>([])
const activeEditors = ref<EditorUser[]>([])
const editorsLoading = ref(false)
const actionLoading = ref<string | null>(null)
const pendingCount = computed(() => pendingUsers.value.length)

const loadEditors = async () => {
  editorsLoading.value = true
  try {
    const [pending, editors] = await Promise.all([
      useAuthFetch<EditorUser[]>('/api/admin/users?role=pending'),
      useAuthFetch<EditorUser[]>('/api/admin/users?role=editor'),
    ])
    pendingUsers.value = pending
    activeEditors.value = editors
  } finally {
    editorsLoading.value = false
  }
}

// ── Invitaciones ──────────────────────────────────────────────────────────────
const generatingInvite = ref(false)
const generatedLink = ref('')
const copied = ref(false)

const handleGenerateInvite = async () => {
  generatingInvite.value = true
  try {
    const { token } = await useAuthFetch<{ token: string }>('/api/admin/invite', { method: 'POST' })
    generatedLink.value = `${window.location.origin}/registro/${token}`
    copied.value = false
  } finally {
    generatingInvite.value = false
  }
}

const copyLink = async () => {
  await navigator.clipboard.writeText(generatedLink.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 3000)
}

// ── Acciones sobre editores ───────────────────────────────────────────────────
const handleApprove = async (uid: string) => {
  if (!confirm('¿Aprobar este editor?')) return
  actionLoading.value = uid
  try {
    await useAuthFetch('/api/admin/editors', { method: 'POST', body: { uid, action: 'approve' } })
    await loadEditors()
  } finally { actionLoading.value = null }
}

const handleReject = async (uid: string) => {
  if (!confirm('¿Rechazar y eliminar este usuario?')) return
  actionLoading.value = uid
  try {
    await useAuthFetch('/api/admin/editors', { method: 'POST', body: { uid, action: 'reject' } })
    await loadEditors()
  } finally { actionLoading.value = null }
}

const handleRevoke = async (uid: string) => {
  if (!confirm('¿Revocar el acceso de este editor?')) return
  actionLoading.value = uid
  try {
    await useAuthFetch('/api/admin/editors', { method: 'POST', body: { uid, action: 'revoke' } })
    await loadEditors()
  } finally { actionLoading.value = null }
}

const handleDeleteEditor = async (uid: string) => {
  if (!confirm('¿Eliminar permanentemente este editor?')) return
  actionLoading.value = uid
  try {
    await useAuthFetch('/api/admin/editors', { method: 'POST', body: { uid, action: 'delete' } })
    await loadEditors()
  } finally { actionLoading.value = null }
}
</script>

<style scoped>
/* ── Estilos idénticos al original — migrados de scoped a Nuxt ── */
.dashboard-wrapper { max-width: 900px; margin: 0 auto; padding: 2rem 1rem 4rem; }

.tabs-header { display: flex; gap: 0.5rem; border-bottom: 2px solid #e5e7eb; margin-bottom: 2rem; }
.tab-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; font-size: 0.9rem; font-weight: 600; color: #6b7280; background: none; border: none; border-bottom: 3px solid transparent; margin-bottom: -2px; cursor: pointer; transition: color 0.2s, border-color 0.2s; }
.tab-btn:hover { color: #374151; }
.tab-btn--active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.section-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; display: inline-flex; align-items: center; gap: 0.5rem; }

.badge-count { background: #ef4444; color: white; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 100px; min-width: 20px; text-align: center; line-height: 1.4; }
.badge-count--inline { background: #ef4444; color: white; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 100px; }
.badge { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; border-radius: 100px; font-size: 0.72rem; font-weight: 600; }
.badge--draft { background: #fef3c7; color: #92400e; }

.btn-primary { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.2rem; background: var(--color-primary); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.2s; }
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(26,54,93,0.3); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-spinner-inline { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.invite-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin-bottom: 2.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.invite-card__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.invite-card__title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0 0 0.3rem; }
.invite-card__desc { font-size: 0.85rem; color: #6b7280; margin: 0; }
.invite-link-box { margin-top: 1.25rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; }
.invite-link-row { display: flex; align-items: center; gap: 0.75rem; }
.invite-link-text { font-family: monospace; font-size: 0.8rem; color: #374151; word-break: break-all; flex: 1; background: white; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #e5e7eb; }
.btn-copy { padding: 0.5rem 1rem; background: #111827; color: white; border: none; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
.btn-copy:hover { background: #374151; }
.invite-link-note { font-size: 0.78rem; color: #9ca3af; margin: 0.75rem 0 0; }

.editors-section { margin-bottom: 2.5rem; }
.editors-section .section-title { font-size: 1.2rem; margin-bottom: 1rem; }

.list-card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.list { list-style: none; margin: 0; padding: 0; }
.list-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
.list-item:last-child { border-bottom: none; }
.list-item:hover { background: #f9fafb; }
.list-item__info { display: flex; flex-direction: column; gap: 0.2rem; }
.list-item__title-row { display: flex; align-items: center; gap: 0.75rem; }
.list-item__title { font-size: 0.975rem; font-weight: 600; color: #111827; }
.list-item__meta { font-size: 0.8rem; color: #9ca3af; }
.list-item__actions { display: flex; gap: 0.75rem; flex-shrink: 0; }

.action-link { font-size: 0.82rem; font-weight: 600; cursor: pointer; background: none; border: none; padding: 0; transition: color 0.15s; }
.action-link:disabled { opacity: 0.5; cursor: not-allowed; }
.action-link--view { color: #3b82f6; } .action-link--view:hover { color: #1d4ed8; }
.action-link--edit { color: #f59e0b; } .action-link--edit:hover { color: #d97706; }
.action-link--delete { color: #ef4444; } .action-link--delete:hover { color: #dc2626; }
.action-link--approve { color: #10b981; } .action-link--approve:hover { color: #059669; }

.loading-state { display: flex; justify-content: center; padding: 3rem; }
.spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
.empty-state { text-align: center; padding: 3rem; background: #f9fafb; border-radius: 10px; border: 1px dashed #e5e7eb; }
.empty-text { color: #9ca3af; font-size: 0.9rem; margin: 0 0 0.5rem; }
.link { color: var(--color-primary); text-decoration: none; font-size: 0.875rem; font-weight: 500; }
.link:hover { text-decoration: underline; }
.tab-content { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
</style>
