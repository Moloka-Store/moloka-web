// De una fila del catálogo a la pieza que enseñan las páginas. Funciones puras, sin
// datos: catalogo.js les pasa el fichero, lo escrito de cada pieza y el interruptor de
// la figura; las prueba `node --test` (test/pieza.test.js).
//
// Reglas: no se inventa nada. Lo que no viene en los datos se queda en null y la
// página no lo pinta.
import { numeroDe, serieDe, nombreLimpio } from './nombres.js';

const EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/** «17,90 €», o null si la pieza no tiene precio. */
export function precioTexto(precio) {
  return typeof precio === 'number' ? EUROS.format(precio) : null;
}

// ── Fotos de la figura y su cesión ──────────────────────────────────────────────
// La única cesión que deja enseñar la foto de la figura cuando el interruptor está
// puesto. Cualquier otro valor («por_averiguar», null, uno que no conozcamos) la esconde.
export const CESION_CONFIRMADA = 'confirmada';

/** ¿Se puede enseñar esta foto de la figura? */
export function figuraVisible(foto, soloConCesion) {
  if (!foto || !foto.url) return false;
  return !soloConCesion || foto.cesion === CESION_CONFIRMADA;
}

// ── El tamaño de la caja ────────────────────────────────────────────────────────
// Caja de tamaño especial (donde el protector no cabe): solo la que el nombre dice que es
// de un formato grande. `caja_cm` NO vale para esto: son las medidas del paquete con el
// que la envía Amazon, no las de la caja (quien dirige, 23-nov-2026).
export const FORMATO_GRANDE = /\b(?:Rides?|Deluxe|Jumbo|Town|Moment)\b|\b25\s*cm\b/i;

/** ¿Es una caja de tamaño especial? Se decide solo por el nombre. */
export function cajaEspecial(nombre) {
  return FORMATO_GRANDE.test(nombre || '');
}

/**
 * Qué se dice del protector: «incluido» en lo raro, «opcional» (casilla de 1,50 €) en lo
 * normal, y nada (null) en las cajas de tamaño especial, donde no cabe.
 */
export function protectorDe({ esChase, nombre }) {
  if (cajaEspecial(nombre)) return null;
  return esChase ? 'incluido' : 'opcional';
}
export const PRECIO_PROTECTOR = 1.5;

// ── La dirección de la ficha ────────────────────────────────────────────────────
// `/funko/<nombre>-<número>-chase`: el nombre limpio en minúsculas y sin tildes, el
// número si se sabe (y no está ya en el nombre) y «chase» si lo es. «w/» se lee
// «with»; «&» y los signos se quitan. Si dos piezas dieran la misma, la segunda lleva
// además su código de barras; y si aun así chocan, no se construye.

/** El trozo de dirección de una pieza, sin comprobar que sea único. */
export function slugDe({ nombre, numero, esChase }) {
  const partes = String(nombre || '')
    .replace(/\bw\//gi, 'with ')
    .normalize('NFD').replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (numero && !partes.includes(String(numero))) partes.push(String(numero));
  if (esChase && partes[partes.length - 1] !== 'chase') partes.push('chase');
  return partes.join('-');
}

/** Dirección de cada pieza, por clave. Lanza un error si alguna queda vacía o repetida. */
export function direccionesDe(lista) {
  const porClave = new Map();
  const usadas = new Set();
  for (const p of lista) {
    let slug = slugDe(p);
    if (!slug) throw new Error(`La pieza ${p.clave} se queda sin dirección`);
    if (usadas.has(slug) && p.ean) slug = `${slug}-${p.ean}`;
    if (usadas.has(slug)) throw new Error(`Dirección repetida: /funko/${slug} (${p.clave})`);
    usadas.add(slug);
    porClave.set(p.clave, slug);
  }
  return porClave;
}

// ── La pieza ────────────────────────────────────────────────────────────────────
// Los montajes de la web son de 1200 × 1200 (medidos en los 41). Las demás fotos no
// traen medidas: se enseñan enteras dentro de un panel de tamaño fijo.
const MONTAJE = { ancho: 1200, alto: 1200 };

const conUrl = (f) => f && typeof f.url === 'string' && f.url.trim() !== '';

// ── Fotos que pone la web encima de las de la base (src/data/fotos-extra.json) ──────
// Mientras la web lee una copia fija, las fotos buenas que aún no están en la base van en
// el repo (public/fotos/) y se apuntan por clave: `figura`, `caja` y `base`, cada una con
// `url`, `origen` («fabricante» o «nuestra») y `fuente` (de dónde sale, con la dirección
// exacta de la imagen; «almacén» si es nuestra). Sustituyen a la de la base del mismo tipo.
export const ORIGEN_FABRICANTE = 'fabricante';
export const ORIGEN_NUESTRA = 'nuestra';
const ORIGENES = new Set([ORIGEN_FABRICANTE, ORIGEN_NUESTRA]);

/** Las fotos extra de una pieza, solo las que se entienden (las demás se ignoran). */
export function extrasDe(extra) {
  const out = { figura: null, caja: null, base: null };
  if (!extra || typeof extra !== 'object') return out;
  for (const k of Object.keys(out)) {
    const f = extra[k];
    if (conUrl(f) && ORIGENES.has(f.origen) && typeof f.fuente === 'string' && f.fuente.trim()) {
      out[k] = { url: f.url, origen: f.origen, fuente: f.fuente, cesion: typeof f.cesion === 'string' ? f.cesion : null };
    }
  }
  return out;
}

/** Lo escrito de una pieza (fichas.json), con solo los campos que se entienden. */
function escritoDe(f) {
  if (!f || typeof f !== 'object') return null;
  const textoLista = Array.isArray(f.texto) ? f.texto.filter((t) => typeof t === 'string' && t.trim()) : [];
  const pegatinas = Array.isArray(f.pegatinas)
    ? f.pegatinas.filter((x) => x && typeof x.texto === 'string' && x.texto.trim())
        .map((x) => ({ texto: x.texto, significado: typeof x.significado === 'string' ? x.significado : null }))
    : [];
  return {
    numero: typeof f.numero === 'string' && /^\d{1,4}$/.test(f.numero) ? f.numero : null,
    anio: Number.isInteger(f.anio) ? f.anio : null,
    rareza: typeof f.rareza === 'string' && f.rareza.trim() ? f.rareza : null,
    texto: textoLista,
    porQueEsRara: typeof f.por_que_es_rara === 'string' && f.por_que_es_rara.trim() ? f.por_que_es_rara : null,
    pegatinas,
  };
}

/**
 * La pieza que enseñan las páginas.
 * - `escrito`: lo de fichas.json para esta clave (o nada).
 * - `figuraSoloConCesion`: el interruptor (ver catalogo.js).
 * - `slug`: su trozo de dirección (de `direccionesDe`).
 */
export function aPieza(p, { escrito = null, figuraSoloConCesion = true, slug = null, extra = null, precioWeb } = {}) {
  // El precio de la web (precios-web.json) manda; si la pieza no está ahí, el de la copia.
  const precio = typeof precioWeb === 'number' && precioWeb > 0 ? precioWeb
    : typeof p.precio_venta === 'number' ? p.precio_venta : null;
  const fotosWeb = (p.fotos_web || []).filter(conUrl);
  const fotosCaja = (p.fotos_caja || []).filter(conUrl);
  const x = extrasDe(extra);
  const montaje = fotosWeb.find((f) => f.tipo === 'montaje') || null;
  // La figura: la de fotos-extra.json si la hay (sustituye a la de la base), si no la de la base.
  const figuraBase = fotosWeb.find((f) => f.tipo === 'figura') || null;
  // La de la base no dice de quién es (no todas son de fábrica): origen null.
  const figuraCandidata = x.figura || (figuraBase && { ...figuraBase, origen: null });
  const figura = figuraVisible(figuraCandidata, figuraSoloConCesion) ? figuraCandidata : null;
  // La caja por delante y la base: las de fotos-extra.json si las hay; si no, nuestras fotos.
  const frenteBase = fotosCaja.find((f) => f.tipo === 'frente') || null;
  const culoBase = fotosCaja.find((f) => f.tipo === 'culo') || null;
  const frente = x.caja || (frenteBase && { url: frenteBase.url, origen: ORIGEN_NUESTRA });
  const base = x.base || (culoBase && { url: culoBase.url, origen: ORIGEN_NUESTRA });

  const e = escritoDe(escrito);
  const s = serieDe(p.nombre);
  const esChase = p.es_chase === true;
  const nombre = nombreLimpio(p.nombre);
  const numero = numeroDe(p.nombre) || (e && e.numero) || null;
  const anioDatos = typeof p.lanzamiento === 'string' && /^\d{4}/.test(p.lanzamiento)
    ? Number(p.lanzamiento.slice(0, 4)) : null;

  const fotos = {
    caja: frente ? { url: frente.url, origen: frente.origen } : null,
    figura: figura ? { url: figura.url, origen: figura.origen } : null,
    montaje: montaje ? { url: montaje.url, ...MONTAJE } : null,
    base: base ? { url: base.url, origen: base.origen } : null,
  };
  // Con qué arranca el cromo de la ficha: la figura; si no, el montaje; si no, la caja;
  // si no, la base; y si no hay nada, «foto por hacer» (null).
  const vistaInicial = ['figura', 'montaje', 'caja', 'base'].find((k) => fotos[k]) || null;

  return {
    clave: p.clave,
    nombreOriginal: p.nombre,
    nombre,
    numero,
    serie: s ? s.serie : null,
    licencia: s ? s.licencia : null,
    esChase,
    marca: typeof p.marca === 'string' && p.marca.trim() ? p.marca : null,
    ean: typeof p.ean === 'string' && p.ean.trim() ? p.ean.trim() : null,
    precio,
    precioTexto: precioTexto(precio),
    enAlmacen: p.en_almacen === true,
    anio: anioDatos || (e && e.anio) || null,
    protector: protectorDe({ esChase, nombre: p.nombre }),
    // Para el cromo de la portada y los listados: el montaje y, si no, la caja.
    montaje: fotos.montaje,
    fotoCaja: fotos.caja,
    // Para el cromo de los listados cuando no hay montaje: la figura y, si no, la caja
    // (Fernando, 24-nov-2026: «no tenemos por qué hacer montaje de todas»).
    fotoPanel: fotos.figura ? { url: fotos.figura.url, que: 'figura' } : fotos.caja ? { url: fotos.caja.url, que: 'caja' } : null,
    // Para la ficha: las cuatro, en su orden, y con cuál arranca.
    fotos,
    vistaInicial,
    escrito: e,
    slug,
    url: slug ? `/funko/${slug}` : null,
  };
}

/**
 * El catálogo entero: cada fila pasada a pieza, con su dirección única.
 * `fichas` es lo escrito de cada pieza, por clave (las claves que empiezan por «_» son notas).
 */
export function catalogoDe(filas, { fichas = {}, extras = {}, precios = {}, figuraSoloConCesion = true } = {}) {
  const sinDireccion = filas.map((p) => aPieza(p, { escrito: fichas[p.clave], extra: extras[p.clave], precioWeb: precios[p.clave], figuraSoloConCesion }));
  const direcciones = direccionesDe(sinDireccion);
  return sinDireccion.map((p) => {
    const slug = direcciones.get(p.clave);
    return { ...p, slug, url: `/funko/${slug}` };
  });
}
