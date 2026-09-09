import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        // Main webapp entry (unchanged)
        main: resolve(rootDir, 'index.html'),
        // Standalone, no-login Commercialization Plan questionnaire page
        commercialization: resolve(rootDir, 'commercialization.html'),
        // Standalone, no-login Business Plan generator page
        businessPlan: resolve(rootDir, 'business-plan.html'),
      },
    },
  },
});
