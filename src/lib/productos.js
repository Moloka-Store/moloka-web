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
      .select('slug,nombre,fandom,categoria,precio,disponibilidad,es_chase,es_vaulted,es_exclusivo,imagen_principal,origen,activo,actualizado')
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
  const rar = p.es_chase ? 'chase' : p.es_vaulted ? 'vaulted' : p.es_exclusivo ? 'excl' : null;
  return {
    nm: p.nombre,
    fr: p.fandom,
    rar,
    disp: p.disponibilidad || 'inmediato',
    precio: p.precio,
    slug: p.slug,
    imagen: p.imagen_principal,
  };
}
