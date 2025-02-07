import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Read package.json to get build number
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Log environment variables (safely)
  console.log('Vite Environment Variables:', {
    VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY ? '***' + env.VITE_FIREBASE_API_KEY.slice(-6) : 'missing',
    VITE_FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN || 'missing',
    VITE_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID || 'missing'
  });

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000, // Increase size limit to 5MB
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
          skipWaiting: true,
          clientsClaim: true,
          navigateFallback: '/index.html',
          navigateFallbackAllowlist: [/^(?!\/__).*/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => !url.protocol.startsWith('chrome-extension'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                }
              }
            }
          ]
        },
        includeAssets: ['pwa-192x192.png', 'favicon.ico', 'robots.txt'],
        manifest: {
          name: 'Royal Precast CRM',
          short_name: 'RoyalPrecast',
          description: 'Customer Relationship Management for Royal Precast',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-popover', '@radix-ui/react-slot'],
          }
        }
      }
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    define: {
      __BUILD_NUMBER__: JSON.stringify(pkg.buildNumber || '0'),
      __APP_VERSION__: JSON.stringify(pkg.version)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 5173,
      host: true
    }
  };
});