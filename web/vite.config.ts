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
          name: '2d task board',
          short_name: '2d task board',
          description: '2d task board',
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
      }),
      nodePolyfills()
    ],
    build: {
      chunkSizeWarningLimit: 1600
    },
    base: '/2dTaskBoard/',
  }
})
