import { defineConfig } from 'vite'
import path from 'path';
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,  //default port for Vite
    open: true,
  },
  test: {
    globals: true,
    environment: "jsdom",  // required for DOM-related tests
    setupFiles:'./src/setupTests.js'
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
