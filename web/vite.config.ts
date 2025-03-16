import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl'

// required for the gray-matter plugin.
// https://github.com/davidmyersdev/vite-plugin-node-polyfills
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      mode === 'development' && basicSsl(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: '2dTaskBoard',
          short_name: '2dTaskBoard',
          description: '2d task boardTask management productivity app with markdown support',
          theme_color: '#1f2937',
          icons: [
            {
              src: '/logo2.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/logo.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          modifyURLPrefix: {
            "": "/2dTaskBoard/", // Prepend "2dTaskBoard/" to all asset paths
          }
        }
      }),
      nodePolyfills()
    ],
    build: {
      chunkSizeWarningLimit: 1600
    },
    base: '/2dTaskBoard/',
  }
})
