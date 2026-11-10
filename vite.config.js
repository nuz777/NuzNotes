import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: funciona en GitHub Pages (/block-de-notas/) y en Azure (raíz)
  base: './',
  build: {
    outDir: 'dist',
  },
});
