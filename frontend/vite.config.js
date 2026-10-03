import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// High-Tech Vite Performance Config for Instant Millisecond Responses
export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-ui';
            }
            if (id.includes('@tiptap') || id.includes('react-quill')) {
              return 'vendor-editor';
            }
            if (id.includes('docx') || id.includes('html2pdf') || id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-export';
            }
            return 'vendor-libs';
          }
        }
      }
    }
  }
});
