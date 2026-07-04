import { getProductos } from '../lib/productos.js';
import { CATS, slugCat } from '../lib/categorias.js';

// Sitemap propio (sin dependencias): se genera en cada build a partir de
// las páginas fijas + las categorías con producto + todas las fichas vivas.
// Escala solo: cada ficha nueva de Supabase entra aquí en el siguiente build.
const SITE = 'https://moloka.es';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function GET() {
  const productos = await getProductos();

  const urls = [];
  const add = (loc, priority, lastmod) => urls.push({ loc: SITE + loc, priority, lastmod });

  // Páginas fijas
  add('/', '1.0');
  ['/funko', '/banpresto', '/tamashii', '/model-kit', '/guias', '/contacto'].forEach((u) => add(u, '0.7'));

  // Categorías de Funko que tienen al menos un producto
  CATS.filter((c) => productos.some((p) => p.categoria === c)).forEach((c) => {
    const s = slugCat(c);
    if (s) add(`/funko/categoria/${s}`, '0.6');
  });

  // Fichas de producto
  for (const p of productos) {
    if (!p.slug) continue;
    const lastmod = p.actualizado ? new Date(p.actualizado).toISOString().slice(0, 10) : null;
    add(`/funko/${p.slug}`, '0.8', lastmod);
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          '  <url>\n' +
          `    <loc>${esc(u.loc)}</loc>\n` +
          (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '') +
          `    <priority>${u.priority}</priority>\n` +
          '  </url>'
      )
      .join('\n') +
    '\n</urlset>\n';

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
