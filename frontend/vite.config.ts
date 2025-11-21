import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../public",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "http://localhost:3020",
      "/dashboard.yaml": "http://localhost:3020",
      "/socket.io": {
        target: "http://localhost:3020",
        ws: true,
      },
    },
  },
});