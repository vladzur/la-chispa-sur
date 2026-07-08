#!/usr/bin/env node
// scripts/set-admin.mjs
// Utilidad CLI para leer y modificar Firebase Custom Claims (roles admin/editor).
//
// Uso:
//   node scripts/set-admin.mjs --email tu@email.com --admin true
//   node scripts/set-admin.mjs --email tu@email.com --editor false
//   node scripts/set-admin.mjs --uid <UID> --admin true --editor true
//   node scripts/set-admin.mjs --email tu@email.com  (solo consultar)
//
// Requiere el archivo .env en la raíz del proyecto con las variables
// FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// ---------------------------------------------------------------------------
// 1. Cargar .env manualmente
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const ENV_PATH = resolve(PROJECT_ROOT, '.env')

/**
 * Parsea un archivo .env y devuelve un objeto clave → valor.
 */
function loadEnv(path) {
  const vars = {}
  try {
    const content = readFileSync(path, 'utf-8')
    for (const raw of content.split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eqIdx = line.indexOf('=')
      if (eqIdx === -1) continue
      const key = line.slice(0, eqIdx).trim()
      let value = line.slice(eqIdx + 1).trim()
      // Quitar comillas si las tiene
      if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1)
      }
      vars[key] = value
    }
  } catch {
    console.error('❌ No se pudo leer el archivo .env. Asegúrate de que existe en la raíz del proyecto.')
    process.exit(1)
  }
  return vars
}

// ---------------------------------------------------------------------------
// 2. Inicializar Firebase Admin SDK
// ---------------------------------------------------------------------------
function initAdmin(env) {
  if (getApps().length > 0) return

  const projectId = env.FIREBASE_PROJECT_ID
  const clientEmail = env.FIREBASE_CLIENT_EMAIL
  const privateKey = env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Faltan variables de entorno en .env:')
    console.error('   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY')
    process.exit(1)
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  })

  console.log(`✅ Firebase Admin inicializado — proyecto: ${projectId}`)
}

// ---------------------------------------------------------------------------
// 3. Parsear argumentos CLI
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { admin: undefined, editor: undefined, email: undefined, uid: undefined, help: false }

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--email' || a === '-e') opts.email = args[++i]
    else if (a === '--uid' || a === '-u') opts.uid = args[++i]
    else if (a === '--admin') opts.admin = args[++i] === 'true'
    else if (a === '--editor') opts.editor = args[++i] === 'true'
    else if (a === '--help' || a === '-h') opts.help = true
  }

  return opts
}

function showHelp() {
  console.log(`
📋 set-admin — Gestiona los Firebase Custom Claims de usuarios de La Chispa Sur

USO:
  node scripts/set-admin.mjs [OPCIONES]

OPCIONES:
  --email,  -e   Email del usuario a modificar
  --uid,    -u   UID del usuario a modificar
  --admin        true | false  → asignar o revocar el claim admin
  --editor       true | false  → asignar o revocar el claim editor
  --help,   -h   Muestra esta ayuda

EJEMPLOS:
  # Hacer admin a un usuario
  node scripts/set-admin.mjs --email yo@email.com --admin true

  # Revocar editor
  node scripts/set-admin.mjs --email otro@email.com --editor false

  # Poner ambos roles a la vez
  node scripts/set-admin.mjs --uid abc123 --admin true --editor true

  # Solo consultar los claims actuales
  node scripts/set-admin.mjs --email yo@email.com
`)
}

// ---------------------------------------------------------------------------
// 4. Lógica principal
// ---------------------------------------------------------------------------
async function main() {
  const opts = parseArgs()

  if (opts.help) {
    showHelp()
    process.exit(0)
  }

  if (!opts.email && !opts.uid) {
    console.error('❌ Debes especificar --email o --uid.')
    console.error('   Usa --help para ver las opciones.')
    process.exit(1)
  }

  const env = loadEnv(ENV_PATH)
  initAdmin(env)
  const auth = getAuth()

  // Resolver UID si se pasó email
  let uid = opts.uid
  if (!uid && opts.email) {
    try {
      const user = await auth.getUserByEmail(opts.email)
      uid = user.uid
      console.log(`🔍 Usuario encontrado: ${user.email} (UID: ${uid})`)
    } catch {
      console.error(`❌ No se encontró ningún usuario con el email: ${opts.email}`)
      process.exit(1)
    }
  }

  // Solo lectura: si no se indicó --admin ni --editor
  const wantsWrite = opts.admin !== undefined || opts.editor !== undefined

  if (!wantsWrite) {
    // Modo consulta
    const user = await auth.getUser(uid)
    const claims = user.customClaims || {}
    console.log(`\n📋 Claims actuales de ${user.email || uid}:`)
    console.log(`   admin:  ${claims.admin === true ? '✅ true' : '❌ false / sin asignar'}`)
    console.log(`   editor: ${claims.editor === true ? '✅ true' : '❌ false / sin asignar'}`)
    return
  }

  // Modo escritura: leer claims actuales para hacer merge
  const user = await auth.getUser(uid)
  const current = user.customClaims || {}
  const updated = { ...current }

  if (opts.admin !== undefined) {
    if (opts.admin) updated.admin = true
    else delete updated.admin
  }

  if (opts.editor !== undefined) {
    if (opts.editor) updated.editor = true
    else delete updated.editor
  }

  await auth.setCustomUserClaims(uid, updated)

  console.log(`\n✅ Claims actualizados para ${user.email || uid}:`)
  console.log(`   admin:  ${updated.admin === true ? '✅ true' : '❌ false / sin asignar'}`)
  console.log(`   editor: ${updated.editor === true ? '✅ true' : '❌ false / sin asignar'}`)
  console.log('\n⚠️  El usuario debe cerrar sesión y volver a iniciarla para que los nuevos claims surtan efecto.')
}

main().catch((err) => {
  console.error('❌ Error inesperado:', err.message)
  process.exit(1)
})
