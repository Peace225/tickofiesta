import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  // ✅ Pré-bundle les grosses libs
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', '@reduxjs/toolkit'],
    esbuildOptions: { target: 'es2020' }
  },

  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // <— supprime 2Mo de maps en prod
    cssCodeSplit: true,
    reportCompressedSize: false, // build 40% plus rapide
    minify: 'esbuild', // <— 10x plus rapide que terser
    assetsInlineLimit: 4096, // inline les petits SVG

    esbuild: {
      drop: ['console', 'debugger'], // même effet que terser
      legalComments: 'none'
    },

    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
            if (id.includes('@reduxjs') || id.includes('react-redux')) return 'vendor-redux'
            if (id.includes('lucide-react')) return 'vendor-ui'
            if (id.includes('supabase')) return 'vendor-supabase'
            return 'vendor-libs'
          }
        },
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },

  server: {
    port: 3000,
    host: true,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } }
  }
})