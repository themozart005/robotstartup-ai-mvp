// frontend/vite.config.ts
// Vite configuration for fast development and optimized builds

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    proxy: {
      // Proxy API requests to backend during development
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy WebSocket connections
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      }
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize chunks for better loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
          utils: ['zustand', 'axios']
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles')
    }
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  // CSS configuration
  css: {
    postcss: './postcss.config.js',
  },

  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'zustand',
      'axios',
      'socket.io-client'
    ]
  },

  // Preview server (for production builds)
  preview: {
    port: 3000,
    host: true
  }
});

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * This Vite configuration file sets up our frontend build system:
 * 
 * 1. DEVELOPMENT SERVER:
 *    - Runs on port 3000
 *    - Proxies API calls to backend (port 5000)
 *    - Enables hot module replacement for fast development
 * 
 * 2. BUILD OPTIMIZATION:
 *    - Splits code into chunks for faster loading
 *    - Separates vendor libraries from app code
 *    - Generates source maps for debugging
 * 
 * 3. PATH ALIASES:
 *    - @components instead of ../../../components
 *    - Makes imports cleaner and easier to refactor
 * 
 * 4. PROXY CONFIGURATION:
 *    - Routes /api/* requests to backend server
 *    - Handles WebSocket connections for real-time features
 * 
 * 5. OPTIMIZATION:
 *    - Pre-bundles common dependencies
 *    - Configures CSS processing with PostCSS
 *    - Sets up production build settings
 * 
 * This configuration provides fast development experience and optimized
 * production builds for the best user experience.
 */