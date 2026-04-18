# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile multi-etapa para Nuxt 3 SSR en Google Cloud Run
# Imagen final: ~150MB | Sin node_modules | Nitro standalone
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Dependencias ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar solo los archivos de dependencias para aprovechar el cache de Docker
COPY package.json package-lock.json ./

# npm ci es más rápido y determinístico que npm install
RUN npm ci --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de build públicas (se embeben en el bundle del cliente en build time)
# Pásalas con: docker build --build-arg NUXT_PUBLIC_FIREBASE_API_KEY=... .
ARG NUXT_PUBLIC_FIREBASE_API_KEY
ARG NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NUXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NUXT_PUBLIC_FIREBASE_APP_ID
ARG NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID

ENV NUXT_PUBLIC_FIREBASE_API_KEY=$NUXT_PUBLIC_FIREBASE_API_KEY
ENV NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NUXT_PUBLIC_FIREBASE_PROJECT_ID=$NUXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NUXT_PUBLIC_FIREBASE_APP_ID=$NUXT_PUBLIC_FIREBASE_APP_ID
ENV NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID

# Nitro preset node-server genera .output/ standalone (sin node_modules)
RUN npm run build

# ── Stage 3: Runner (imagen mínima de producción) ─────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Usuario no-root por seguridad en Cloud Run
RUN addgroup --system --gid 1001 nuxt \
 && adduser  --system --uid 1001 nuxt

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
