# 🚀 Optimization TODO

## Bundle Size Warning (>500KB after minification)

**Status:** ⚠️ Warning dari Vite build - aplikasi tetap berfungsi normal

**Dampak:**
- Loading time bisa lebih lambat untuk user
- Bandwidth usage lebih besar

## Solusi yang Bisa Diterapkan:

### 1. Code Splitting dengan Dynamic Imports
```typescript
// Contoh implementasi:
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reports = lazy(() => import('./pages/Reports'));
const Contracts = lazy(() => import('./pages/Contracts'));

// Wrap dengan Suspense
<Suspense fallback={<div>Loading...</div>}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

### 2. Manual Chunks di vite.config.ts
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    }
  }
});
```

### 3. Increase Warning Limit (Quick Fix)
```typescript
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000 // Naikan dari 500kb ke 1000kb
  }
});
```

## Analisis Bundle Size
Gunakan tools ini untuk analisis detail:
```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Atau gunakan
npm run build -- --analyze
```

## Prioritas:
1. **High:** Dynamic imports untuk halaman besar (Dashboard, Reports)
2. **Medium:** Manual chunks untuk vendor libraries
3. **Low:** Increase warning limit

## Target:
- Chunk utama < 300KB
- Vendor chunk < 200KB
- Loading time halaman utama < 2 detik

---
*Dibuat: 24 Desember 2025*  
*Update terakhir: Belum ada optimasi*