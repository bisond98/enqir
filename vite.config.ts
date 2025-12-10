import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8083,
    open: true,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
      // Prevent file watching from reverting changes
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      // Don't clear screen on file changes (prevents confusion)
      clearScreen: false,
    },
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  optimizeDeps: {
    force: true, // Force dependency pre-bundling
  },
  
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'vendor-motion': ['framer-motion'],
          'vendor-date': ['date-fns'],
        },
        // Optimize asset filenames for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|ttf|eot/i.test(extType)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Minify with optimized settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true,
        pure_funcs: ['console.log'], // Remove console.log in production
        passes: 3, // Run compression multiple times for better results
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_methods: true,
      },
      mangle: {
        safari10: true, // Fix Safari 10+ issues
        properties: false, // Keep property names for better debugging
      },
      format: {
        comments: false, // Remove comments
      },
    },
    // Target modern browsers for better optimization
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    // Optimize CSS
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: false, // Faster builds
  },
}));