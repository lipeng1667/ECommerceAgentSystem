import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // A new value is generated every time the dev server starts or a production
  // bundle is built. The prototype uses it to require a fresh login after each deployment.
  const deploymentId = new Date().toISOString();

  // Dev-only proxy for the kiosk-gateway /api calls: routing them same-origin through
  // /gateway removes CORS and absorbs the gateway's self-signed cert (secure: false).
  // Target comes from .env.local (VITE_KIOSK_GATEWAY_STREAM_URL = the real gateway origin),
  // so no host is hardcoded here. The streaming iframe still loads direct from that origin.
  const env = loadEnv(mode, '.', '');
  const gatewayTarget = env.VITE_KIOSK_GATEWAY_STREAM_URL;

  return {
    plugins: [react()],
    define: {
      __ALLMALL_DEPLOYMENT_ID__: JSON.stringify(deploymentId),
    },
    build: {
      chunkSizeWarningLimit: 900
    },
    server: {
      port: 5174,
      proxy: gatewayTarget
        ? {
            '/gateway': {
              target: gatewayTarget,
              changeOrigin: true,
              secure: false, // gateway uses a self-signed cert in dev
              rewrite: (path) => path.replace(/^\/gateway/, ''),
            },
          }
        : undefined,
    }
  };
});
