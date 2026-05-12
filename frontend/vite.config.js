import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' // Nécessaire pour les alias

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()
  ],
  
  base: '/',

  // Configuration des alias pour des imports plus propres (Style Pro)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Augmente la limite pour éviter les avertissements sur les gros chunks UI
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Stratégie de Manual Chunks optimisée pour le cache navigateur
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@reduxjs') || id.includes('react-redux')) {
              return 'vendor-redux';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('supabase')) {
              return 'vendor-supabase';
            }
            // Regroupe le reste des libs pour éviter trop de petits fichiers
            return 'vendor-libs';
          }
        },
        // Nettoyage des noms de fichiers pour la production
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    },
    // Minification poussée pour la performance XXL
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprime les console.log en production
        drop_debugger: true,
      },
    },
  },

  server: {
    port: 3000, // Port standard pour le développement React
    host: true, // Permet l'accès via ton réseau local (utile pour tester sur mobile)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})