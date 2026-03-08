import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // sockjs-client (CommonJS) references Node's `global`; polyfill for browser
      global: 'globalThis',
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'https://mytogetherapi-production.up.railway.app',
          changeOrigin: true,
          secure: true,
        },
        '/ws': {
          target: env.VITE_API_BASE_URL || 'https://mytogetherapi-production.up.railway.app',
          changeOrigin: true,
          secure: true,
          ws: true,
        },
      },
    },
  };
});
