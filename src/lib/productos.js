import { createClient } from '@supabase/supabase-js';

// Estas dos variables se definen en Vercel (y en un .env local).
// La anon/publishable key es pública por diseño; aun así la leemos de entorno
// para no dejarla escrita en el código y poder cambiarla sin tocar archivos.
const url = import.meta.env.SUPABASE_URL;
const key = import.meta.env.SUPABASE_ANON_KEY;

/**
 * Lee de web_productos los productos listos (pasados por la fábrica).
 * Se ejecuta EN EL BUILD (Astro estático). Si Supabase no respondiera,
 * devuelve [] para que el build NO se rompa y la web siga en pie.
 */
export async function getProductos() {
  if (!url || !key) {
    console.warn('[supabase] Faltan SUPABASE_URL / SUPABASE_ANON_KEY — la web se genera sin productos.');
    return [];
  }
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('web_productos')
      .select('slug,nombre,fandom,categoria,precio,precio_web,precio_oferta,disponibilidad,es_chase,es_vaulted,es_exclusivo,imagen_principal,origen,activo,actualizado')
      .eq('activo', true)
      .eq('origen', 'fabrica')                 // solo lo pasado por la fábrica
      .order('actualizado', { ascending: false });
    if (error) {
      console.warn('[supabase] Error leyendo web_productos:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('[supabase] Excepción leyendo web_productos:', e.message);
    return [];
  }
}

/** Convierte una fila de web_productos a la forma que usa la tarjeta (Card.astro). */
export function aCard(p) {
  const rars = [];
  if (p.es_chase) rars.push('chase');
  if (p.es_vaulted) rars.push('vaulted');
  if (p.es_exclusivo) rars.push('excl');
  return {
    nm: p.nombre,
    fr: p.fandom,
    cat: p.categoria || null,
    rars,                                   // todas las que aplican (un Funko puede ser varias)
    disp: p.disponibilidad || 'inmediato',
    precio: p.precio_web != null ? p.precio_web : p.precio,
    precio_oferta: p.precio_oferta,   // ← lee el precio de la web; si está vacío, cae al precio genérico
    slug: p.slug,
    imagen: p.imagen_principal,
  };
}
/**
 * Trae los productos con TODOS los campos que necesita la ficha de detalle
 * (galería completa, descripción, licencia, EAN). Para getStaticPaths.
 */
export async function getProductosFull() {
  if (!url || !key) {
    console.warn('[supabase] Sin credenciales — no se generan fichas de producto.');
    return [];
  }
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('web_productos')
      .select('slug,nombre,titulo_seo,fandom,categoria,licencia,ean,precio,precio_web,precio_oferta,disponibilidad,es_chase,es_vaulted,es_exclusivo,imagen_principal,imagenes,descripcion_html,origen,activo')
      .eq('activo', true)
      .eq('origen', 'fabrica');
    if (error) { console.warn('[supabase] Error en getProductosFull:', error.message); return []; }
    return data || [];
  } catch (e) {
    console.warn('[supabase] Excepción en getProductosFull:', e.message);
    return [];
  }
}

/** Mapea una fila completa a la forma que usa la ficha de detalle. */
export function aFicha(p) {
  const rars = [];
  if (p.es_chase) rars.push('chase');
  if (p.es_vaulted) rars.push('vaulted');
  if (p.es_exclusivo) rars.push('excl');
  const fotos = Array.isArray(p.imagenes) && p.imagenes.length
    ? p.imagenes
    : (p.imagen_principal ? [p.imagen_principal] : []);
  return {
    slug: p.slug,
    nm: p.nombre,
    titulo: p.titulo_seo || p.nombre,
    fr: p.fandom,
    cat: p.categoria,
    lic: p.licencia,
    ean: p.ean,
    rars,
    disp: p.disponibilidad || 'inmediato',
    precio: p.precio_web != null ? p.precio_web : p.precio,
    precio_oferta: p.precio_oferta,   // ← mismo arreglo en la ficha de detalle
    desc: p.descripcion_html || '',
    fotos,
  };
}
