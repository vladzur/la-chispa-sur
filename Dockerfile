# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile multi-etapa para Nuxt 3 SSR en Google Cloud Run
# Imagen final: ~150MB | Sin node_modules | Nitro standalone
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Dependencias ─────────────────────────────────────────────────────
FROM node:20-slim AS deps
WORKDIR /app

# Copiar solo los archivos de dependencias para aprovechar el cache de Docker
COPY package.json package-lock.json ./

# npm ci es más rápido y determinístico que npm install
RUN npm install

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables falsas (mocks) para que Nuxt no falle al prerenderizar rutas
# durante el build en Cloud Build. Los valores reales serán inyectados por Cloud Run.
ENV NUXT_PUBLIC_FIREBASE_API_KEY=mock
ENV NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mock
ENV NUXT_PUBLIC_FIREBASE_PROJECT_ID=mock
ENV NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mock
ENV NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=mock
ENV NUXT_PUBLIC_FIREBASE_APP_ID=mock
ENV NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=mock
ENV FIREBASE_PROJECT_ID=mock
ENV FIREBASE_CLIENT_EMAIL=mock@example.com
ENV FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nmock\n-----END PRIVATE KEY-----\n"

# Nitro preset node-server genera .output/ standalone (sin node_modules)
RUN npm run build

# ── Stage 3: Runner (imagen mínima de producción) ─────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

# Usuario no-root por seguridad en Cloud Run (Sintaxis de Debian/slim)
RUN groupadd --system --gid 1001 nuxt \
 && useradd --system --uid 1001 --gid 1001 nuxt

# Copiar solo .output/ — contiene el servidor Nitro compilado + assets del cliente
# NO se necesitan node_modules: Nitro bundlea todo
COPY --from=builder --chown=nuxt:nuxt /app/.output ./

USER nuxt

# Cloud Run inyecta PORT automáticamente (por defecto 8080)
ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Variables server-side de Firebase Admin SDK
# Inyéctalas via: gcloud run deploy --set-env-vars o Secret Manager
# ENV FIREBASE_PROJECT_ID=...
# ENV FIREBASE_CLIENT_EMAIL=...
# ENV FIREBASE_PRIVATE_KEY=...

EXPOSE 8080

# Servidor Nitro standalone — no requiere `nuxt start` ni node_modules
CMD ["node", "server/index.mjs"]
