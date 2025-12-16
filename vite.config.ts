import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv loads .env files. process.env is also available in Node environment where vite config runs.
  // We use process.env.VITE_PROXY_TARGET as a fallback or priority if set in docker-compose.
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = process.env.VITE_PROXY_TARGET || env.VITE_PROXY_TARGET || 'http://localhost:3000';

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
      host: true, // Needed for Docker
    },
  };
});
