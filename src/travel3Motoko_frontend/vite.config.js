import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      components: path.resolve(__dirname, './src/components'),
      containers: path.resolve(__dirname, './src/containers'),
      context: path.resolve(__dirname, './src/context'),
      library: path.resolve(__dirname, './src/library'),
      settings: path.resolve(__dirname, './src/settings'),
      themes: path.resolve(__dirname, './src/themes'),
    },
  },
  root: '.',
  build: {
    outDir: 'build',
    rollupOptions: {
      input: './index.html'
    }
  },
  define: {
    global: 'window',
  },
});
