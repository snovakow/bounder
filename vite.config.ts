import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import packageJson from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the build runs from the site's bounder/ folder
  base: '',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  build: {
    // The 3D libraries make one chunk of over 1 MB; it's one scene, so it isn't split
    chunkSizeWarningLimit: 1600,
  },
})
