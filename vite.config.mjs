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
        // Vendor chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().split('.')[0]
            : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        // Assets
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Manualchunks for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'form-vendor': ['@hookform/resolvers', 'zod'],
          'data-vendor': ['papaparse', 'pdfkit', 'xlsx'],
          // Utilities
          'utils': ['crypto-js', 'qrcode', 'speakeasy']
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
