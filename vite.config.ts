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
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // React core
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            // React Router + Remix run
            if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
              return 'vendor-router';
            }
            // Recharts + its D3 sub-deps
            if (
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/number-precision') ||
              id.includes('node_modules/decimal.js-light')
            ) {
              return 'vendor-charts';
            }
            // Radix UI primitives
            if (id.includes('node_modules/@radix-ui/')) {
              return 'vendor-radix';
            }
            // WebSocket / STOMP
            if (id.includes('node_modules/@stomp/') || id.includes('node_modules/sockjs-client')) {
              return 'vendor-ws';
            }
            // xlsx is very large — isolate it so it only loads on import pages
            if (id.includes('node_modules/xlsx')) {
              return 'vendor-xlsx';
            }
            // Lucide icons
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-lucide';
            }
          },
        },
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
