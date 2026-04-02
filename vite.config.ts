import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // Inline assets smaller than 4 KB
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Split large vendor libs into separate lazy-loaded chunks
        // This reduces the initial JS bundle (improves TBT + TTI)
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) {
            return 'firebase'
          }
          if (
            id.includes('@tiptap') ||
            id.includes('prosemirror')
          ) {
            return 'tiptap'
          }
          if (
            id.includes('node_modules/vue') ||
            id.includes('node_modules/pinia') ||
            id.includes('node_modules/vue-router')
          ) {
            return 'vendor'
          }
        }
      }
    }
  }
})
