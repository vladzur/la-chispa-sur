# La Chispa Sur 🔥

Blog de noticias construido con **Vue 3**, **TypeScript** y **Firebase**. Pensado para equipos editoriales pequeños con un flujo de aprobación seguro y soporte de previsualización social enriquecida.

---

## ✨ Características principales

### 📰 Publicación de contenido
- Listado de artículos con tarjetas en la portada
- Vista de detalle por artículo (`/post/:id`)
- Soporte de borradores (`published: false`) — visible solo para editores/admin
- Campo de imagen de cabecera por artículo

### ✍️ Editor de artículos (TipTap)
- Editor de texto enriquecido basado en [TipTap](https://tiptap.dev/) con soporte de:
  - Negritas, itálicas, subrayado, listas, headings
  - Inserción de imágenes y enlaces
- Creación y edición de artículos autorizados por rol
- Carga de imagen de cabecera con vista previa
- Borrador / publicación inmediata

### 👍 Sistema de Kudos
- Lectores anónimos pueden dar hasta **10 kudos** por artículo
- Sin necesidad de cuenta — la cuota se persiste en `localStorage`
- Animación de aplausos al interactuar
- Protección en reglas de Firestore: solo permite incrementar `kudosCount`

### 🔐 Sistema de roles y acceso
| Rol | Permisos |
|---|---|
| **Admin** | Acceso total: crear/editar/eliminar posts, gestionar editores, generar invitaciones |
| **Editor** | Crear y editar sus propios artículos publicados |
| **Pending** | Registrado pero en espera de aprobación; acceso restringido |
| **Anónimo** | Solo lectura de posts publicados + kudos |

### 📩 Registro por invitación
- El admin genera un **enlace de invitación único** con expiración de 72 horas
- El enlace usa un token UUID almacenado en la colección `inviteTokens`
- Al usarlo, el nuevo usuario queda con rol `pending` hasta aprobación manual
- El token se marca como usado tras el registro exitoso

### 🛡️ Panel de administración
- Dashboard exclusivo para admin en `/admin`
- Listado de usuarios **pendientes** con opciones de aprobar o rechazar
- Listado de **editores activos** con opciones de revocar acceso o eliminar cuenta
- Generación de nuevos enlaces de invitación desde la interfaz

### 🔄 Flujo de aprobación de editores
```
Admin genera invitación → Editor se registra via /registro/:token
→ Rol asignado: "pending" → Admin aprueba via Dashboard
→ Rol actualizado a "editor" (via Cloud Function) → Editor accede al panel
```

### 🌐 Vista previa social (Open Graph / Twitter Cards)
- Cloud Function `renderPostTags` inyecta meta tags dinámicos (OG + Twitter) para cada artículo
- Las rutas `/post/**` se redirigen a la función antes de servir el SPA
- Títulos, descripciones e imágenes correctamente indexadas por redes sociales

### 📊 Analíticas
- Integración con **Firebase Analytics**: registra `page_view` en cada navegación del router

### ⚡ Rendimiento y caché
- Caché de posts en `sessionStorage` + memoria con TTL de 30 minutos (reduce lecturas a Firestore)
- Cache-Control configurado en Firebase Hosting:
  - Activos estáticos (JS/CSS): 1 año inmutable
  - Imágenes y fuentes: 1 día
  - `index.html`: sin caché (siempre actualizado)
- Lazy loading de imágenes de portada

---

## 🏗️ Stack tecnológico

| Categoría | Tecnología |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite |
| Estilos | Tailwind CSS v4 |
| Estado | Pinia |
| Routing | Vue Router 5 |
| Editor | TipTap 3 |
| Meta tags | `@unhead/vue` |
| Backend | Firebase (Firestore, Auth, Hosting, Functions) |
| Cloud Functions | Node.js + TypeScript |
| Tests | Vitest + Vue Test Utils |
| CI/CD | GitHub Actions |

---

## 🚀 Configuración del proyecto

### 1. Clona el repositorio e instala dependencias

```bash
git clone https://github.com/tu-usuario/la-chispa-sur.git
cd la-chispa-sur
npm install
```

### 2. Variables de entorno

Copia `.env.example` a `.env` y completa con tus credenciales de Firebase:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

### 3. Desarrollar en local

```bash
npm run dev
```

---

## 🧪 Tests

```bash
# Ejecución única
npm run test

# Modo watch
npm run test:watch

# Cobertura
npm run coverage
```

---

## 🚢 Despliegue

```bash
# Build de producción
npm run build

# Deploy completo (Hosting + Functions + Firestore rules)
firebase deploy
```

> **Nota:** Las Cloud Functions se compilan automáticamente antes del deploy (`npm run build` en `/functions`).

---

## 📁 Estructura relevante

```
src/
├── components/
│   ├── KudosButton.vue       # Sistema de aplausos anónimos
│   ├── Navbar.vue            # Barra de navegación con logo
│   └── PostCard.vue          # Tarjeta de artículo en portada
├── views/
│   ├── HomeView.vue          # Portada con listado de artículos
│   ├── PostDetailView.vue    # Vista de artículo individual
│   ├── EditorView.vue        # Editor TipTap para redactores
│   ├── AdminDashboardView.vue# Panel de gestión de editores
│   ├── LoginView.vue         # Autenticación
│   ├── RegisterView.vue      # Registro via enlace de invitación
│   └── PendingApprovalView.vue# Pantalla de espera para pendientes
├── services/
│   ├── postService.ts        # CRUD de posts + caché
│   ├── editorService.ts      # Gestión de invitaciones y editores
│   └── imageService.ts       # Subida de imágenes
├── stores/
│   └── auth.ts               # Estado de autenticación (Pinia)
└── router/
    └── index.ts              # Rutas y guards de navegación

functions/src/
└── index.ts                  # Cloud Functions:
                              #   - renderPostTags (SSR de meta tags OG)
                              #   - approveEditor  (aprobación de editores)
                              #   - revokeEditor   (revocación de acceso)
```

---

## 🔒 Seguridad (Firestore Rules)

- Posts: lectura pública; escritura solo para admin/editor aprobado; actualizar kudos sin autenticación (solo campo permitido)
- Usuarios: lectura propia o admin; creación solo con `role: pending` (auto-registro)
- Tokens de invitación: lectura pública para validación; creación solo admin; marcado como usado por el registrante
- Modificaciones de rol exclusivamente via **Cloud Functions** (sin acceso directo desde cliente)
