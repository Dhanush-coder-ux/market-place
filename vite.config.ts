import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // Raise warning threshold — we know some vendor chunks are large
    chunkSizeWarningLimit: 700,
    target: 'es2020',
    cssCodeSplit: true,

    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps each chunk cacheable & small
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Router
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'vendor-router';
          }
          // Redux
          if (id.includes('node_modules/@reduxjs/') || id.includes('node_modules/react-redux/')) {
            return 'vendor-redux';
          }
          // Radix UI primitives
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix';
          }
          // Framer Motion (keep isolated — heavy)
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-motion';
          }
          // Syncfusion Charts (very heavy — isolate)
          if (id.includes('node_modules/@syncfusion/')) {
            return 'vendor-charts';
          }
          // Recharts
          if (id.includes('node_modules/recharts/')) {
            return 'vendor-recharts';
          }
          // Ant Design (heavy — isolate)
          if (id.includes('node_modules/antd/') || id.includes('node_modules/@ant-design/')) {
            return 'vendor-antd';
          }
          // PrimeReact (heavy — isolate)
          if (id.includes('node_modules/primereact/') || id.includes('node_modules/primeicons/')) {
            return 'vendor-prime';
          }
          // Lucide icons
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns/') || id.includes('node_modules/react-day-picker/') || id.includes('node_modules/react-datepicker/')) {
            return 'vendor-dates';
          }
          // Everything else in node_modules goes to vendor-misc
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },

  // Dev server optimization
  server: {
    warmup: {
      clientFiles: [
        './src/app/main.tsx',
        './src/app/App.tsx',
        './src/components/layouts/MainLayout.tsx',
      ],
    },
  },

  // Optimize deps pre-bundling (Dev Server)
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'react-is',
      'antd',
      'primereact',
    ],
  },
})
