import { defineConfig } from 'astro/config';

// Web de Moloka Store — sitio estático (SSG) para SEO máximo.
// Astro lee Supabase en el build y genera un HTML real por cada
// categoría y cada producto. Vercel ejecuta `astro build` en cada push.
export default defineConfig({
  site: 'https://moloka.es',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
});
