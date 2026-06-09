import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isCholo = mode === 'cholo';

  return {
    plugins: [react()],
    base: './',
    build: {
      outDir: isCholo
        ? path.resolve(__dirname, '../projects/cholo Lunge/admin')
        : 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
