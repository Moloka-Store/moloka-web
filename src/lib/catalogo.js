// El catálogo de la web: el ÚNICO sitio por donde las páginas leen las piezas.
//
// Hoy lee una copia fija (`src/data/catalogo.json`, las piezas guardadas para la web
// leídas el 23-nov-2026). Más adelante leerá de la base, y las páginas no deben
// enterarse: lo que exporta este módulo es el contrato.
//
// Reglas: no se inventa nada. Sin precio, `precio` es null y se enseña «precio por
// poner». La única rareza que dan los datos es `es_chase`. El número y la serie salen
// del nombre solo cuando es inequívoco (ver nombres.js); si no, null.
import datos from '../data/catalogo.json';
import { numeroDe, serieDe, nombreLimpio } from './nombres.js';
import { ordenListado } from './listado.js';

const EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/** «17,90 €», o null si la pieza no tiene precio. */
export function precioTexto(precio) {
  return typeof precio === 'number' ? EUROS.format(precio) : null;
}

/** Dirección de la ficha (todavía por construir: llega en su propio tramo). */
export function urlFicha(clave) {
  return `/funko/${encodeURIComponent(clave)}`;
}

function aPieza(p) {
  const montaje = (p.fotos_web || []).find((f) => f.tipo === 'montaje' && f.url) || null;
  // Nuestra foto de la caja por delante (la primera con dirección; algunas vienen vacías).
  const frente = (p.fotos_caja || []).find((f) => f.tipo === 'frente' && f.url) || null;
  const s = serieDe(p.nombre);
  return {
    clave: p.clave,
    nombreOriginal: p.nombre,
    nombre: nombreLimpio(p.nombre),
    numero: numeroDe(p.nombre),
    serie: s ? s.serie : null,
    licencia: s ? s.licencia : null,
    esChase: p.es_chase === true,
    precio: typeof p.precio_venta === 'number' ? p.precio_venta : null,
    precioTexto: precioTexto(p.precio_venta),
    enAlmacen: p.en_almacen === true,
    // Solo el montaje: las fotos de la figura tienen la cesión sin averiguar.
    // Los montajes de la web son de 1200 × 1200.
    montaje: montaje ? { url: montaje.url, ancho: 1200, alto: 1200 } : null,
    // Las fotos de la caja no traen medidas (y cada una mide distinto): se enseñan
    // enteras dentro de un panel cuadrado, así que no hace falta saberlas.
    fotoCaja: frente ? { url: frente.url } : null,
    url: urlFicha(p.clave),
  };
}

const PIEZAS = datos.piezas.map(aPieza);

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
