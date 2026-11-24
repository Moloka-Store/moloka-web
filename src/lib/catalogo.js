// El catálogo de la web: el ÚNICO sitio por donde las páginas leen las piezas.
//
// Hoy lee una copia fija (`src/data/catalogo.json`, las piezas guardadas para la web
// leídas el 23-nov-2026), lo escrito de cada pieza (`src/data/fichas.json`) y las fotos
// buenas que aún no están en la base (`src/data/fotos-extra.json`, en public/fotos/). Más
// adelante leerá de la base, y las páginas no deben enterarse: lo que exporta este
// módulo es el contrato. Cómo se pasa cada fila a pieza está en pieza.js.
//
// El precio es el de la web (`src/data/precios-web.json`); si una pieza no lo tiene, el
// de la copia. Reglas: no se inventa nada. Sin precio, `precio` es null y se enseña
// «precio por poner». La única rareza que dan los datos es `es_chase`. El número y la serie salen
// del nombre solo cuando es inequívoco (ver nombres.js); si no, null.
import datos from '../data/catalogo.json';
import fichas from '../data/fichas.json';
import extras from '../data/fotos-extra.json';
import precios from '../data/precios-web.json';
import { catalogoDe } from './pieza.js';
import { ordenListado } from './listado.js';

export { precioTexto, PRECIO_PROTECTOR } from './pieza.js';

// EL INTERRUPTOR DE LAS FOTOS DE LA FIGURA. Mientras la web está en obras, `false`: se
// enseñan todas. El día del lanzamiento se pone a `true` y solo se enseña la foto de la
// figura cuya cesión esté confirmada; en las demás, la ficha arranca con el montaje.
// Antes de ponerlo a `true` (quien dirige, 24-nov-2026, con lo decidido por Fernando el
// 23-nov: la imagen oficial del fabricante se puede publicar; el riesgo es la foto hecha
// por otro vendedor): el interruptor NO debe tapar las fotos de origen «fabricante» con
// fuente oficial de fotos-extra.json. Hoy las tapa si su cesión no es «confirmada».
export const FIGURA_SOLO_CON_CESION = false;

const PIEZAS = catalogoDe(datos.piezas, { fichas, extras, precios, figuraSoloConCesion: FIGURA_SOLO_CON_CESION });
const POR_CLAVE = new Map(PIEZAS.map((p) => [p.clave, p]));

/** Dirección de la ficha de una pieza, por su clave. */
export function urlFicha(clave) {
  const p = POR_CLAVE.get(clave);
  if (!p) throw new Error(`No hay ninguna pieza con la clave ${clave}`);
  return p.url;
}

/** Todas las piezas del catálogo, en el orden en que vienen. */
export function piezas() {
  return PIEZAS;
}

/** Las que están en el almacén. */
export function enAlmacen() {
  return PIEZAS.filter((p) => p.enAlmacen);
}

/** Las raras del almacén (hoy, solo chase). */
export function rarasEnAlmacen() {
  return enAlmacen().filter((p) => p.esChase);
}

/**
 * Lo que enseña un listado: en el almacén, primero lo raro y después lo demás,
 * cada grupo en el orden del catálogo. Con `soloRaras`, solo lo raro.
 */
export function paraListado({ soloRaras = false } = {}) {
  return ordenListado(soloRaras ? rarasEnAlmacen() : enAlmacen());
}

/** Las que pueden salir como cromo en portada: en el almacén y con montaje. */
export function conCromo(lista = enAlmacen()) {
  return lista.filter((p) => p.montaje);
}

/**
 * Las de la misma hoja que una pieza (su licencia), en el almacén y sin ella, en el
 * orden de los listados. Si la pieza no tiene licencia, null.
 */
export function deLaMismaHoja(pieza) {
  if (!pieza.licencia) return null;
  return paraListado().filter((p) => p.licencia === pieza.licencia && p.clave !== pieza.clave);
}

/** Las piezas con montaje, agrupadas por licencia (la hoja del álbum), de más a menos. */
export function hojasDelAlbum() {
  const hojas = new Map();
  for (const p of conCromo()) {
    if (!p.licencia) continue;
    if (!hojas.has(p.licencia)) hojas.set(p.licencia, []);
    hojas.get(p.licencia).push(p);
  }
  return [...hojas.entries()]
    .map(([licencia, lista]) => ({
      licencia,
      // Primero lo raro, luego lo demás; dentro, en el orden del catálogo.
      piezas: [...lista.filter((p) => p.esChase), ...lista.filter((p) => !p.esChase)],
    }))
    .sort((a, b) => b.piezas.length - a.piezas.length);
}
