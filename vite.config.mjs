import react from '@vitejs/plugin-react';

export default {
  plugins: [react()],
  build: {
    // Target modern browsers with ES2020
    target: 'es2020',
    // Optimize bundle size
    minify: 'esbuild',
    // Source maps for production debugging
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
    // Output directory
    outDir: 'dist',
    // Manifest for production monitoring
    manifest: true,
    rollupOptions: {
      output: {
        // Main bundle
        entryFileNames: 'assets/[name]-[hash].js',
        // Chunk files with hash
        chunkFileNames: 'assets/[name]-[hash].js',
        // Assets
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Manualchunks for better caching (as function)
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            if (id.includes('papaparse') || id.includes('pdfkit') || id.includes('xlsx')) {
              return 'data-vendor';
            }
            if (id.includes('crypto-js') || id.includes('qrcode') || id.includes('speakeasy')) {
              return 'utils';
            }
            return 'vendor';
          }
        }
      }
    },
    // Chunk size warning
    chunkSizeWarningLimit: 500,
    // Report compression size
    reportCompressedSize: true
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@hookform/resolvers',
      'zod'
    ]
  }
};
