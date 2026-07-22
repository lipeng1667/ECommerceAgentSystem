import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  // A new value is generated every time the dev server starts or a production
  // bundle is built. The prototype uses it to require a fresh login after each deployment.
  const deploymentId = new Date().toISOString();

  return {
    plugins: [react()],
    define: {
      __ALLMALL_DEPLOYMENT_ID__: JSON.stringify(deploymentId),
    },
    build: {
      chunkSizeWarningLimit: 900
    },
    server: {
      port: 5174
    }
  };
});
