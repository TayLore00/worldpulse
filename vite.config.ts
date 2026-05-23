import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.org/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
