import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.SUPABASE_URL;
const key = import.meta.env.SUPABASE_ANON_KEY;

export async function getProductos() {
  if (!url || !key) {
    console.warn('[supabase] Faltan SUPABASE_URL / SUPABASE_ANON_KEY — la web se genera sin productos.');
    return [];
  }
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('web_productos')
      .select('slug,nombre,fandom,categoria,precio,precio_web,precio_oferta,disponibilidad,es_chase,es_vaulted,es_exclusivo,imagen_principal,origen,activo,actualizado,seccion')
      .eq('activo', true)
      .in('origen', ['fabrica', 'bems'])
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

export function aCard(p) {
  const rars = [];
  if (p.es_chase) rars.push('chase');
  if (p.es_vaulted) rars.push('vaulted');
  if (p.es_exclusivo) rars.push('excl');
  return {
    nm: p.nombre,
    fr: p.fandom,
    cat: p.categoria || null,
    rars,
    disp: p.disponibilidad || 'inmediato',
    precio: p.precio_web != null ? p.precio_web : p.precio,
    precio_oferta: p.precio_oferta,
    slug: p.slug,
    imagen: p.imagen_principal,
  };
}

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
      .in('origen', ['fabrica', 'bems']);
    if (error) { console.warn('[supabase] Error en getProductosFull:', error.message); return []; }
    return data || [];
  } catch (e) {
    console.warn('[supabase] Excepción en getProductosFull:', e.message);
    return [];
  }
}

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
    precio_oferta: p.precio_oferta,
    desc: p.descripcion_html || '',
    fotos,
  };
}
