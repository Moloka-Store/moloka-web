// El listado de cromos: orden, licencias, búsqueda y filtros.
//
// Funciones puras, sin datos: las usa la página al construir (para escribir en cada
// cromo lo que hace falta para buscarlo) y el navegador (para filtrar sin servidor).
// Las prueba `node --test` (test/listado.test.js).

/** Nombre del grupo de las piezas cuya licencia no se puede sacar del nombre. */
export const OTRAS = 'Otras';

/** Primero lo raro, después lo demás; dentro de cada grupo, el orden en que vienen. */
export function ordenListado(lista) {
  return [...lista.filter((p) => p.esChase), ...lista.filter((p) => !p.esChase)];
}

/** La licencia con la que se filtra una pieza («Otras» si no tiene). */
export function licenciaDe(pieza) {
  return pieza.licencia || OTRAS;
}

/** Las licencias de una lista, con cuántas piezas tiene cada una: de más a menos, «Otras» al final. */
export function licenciasDe(lista) {
  const cuenta = new Map();
  for (const p of lista) {
    const l = licenciaDe(p);
    cuenta.set(l, (cuenta.get(l) || 0) + 1);
  }
  return [...cuenta.entries()]
    .map(([licencia, n]) => ({ licencia, n }))
    .sort((a, b) => {
      if (a.licencia === OTRAS) return 1;
      if (b.licencia === OTRAS) return -1;
      return b.n - a.n || a.licencia.localeCompare(b.licencia, 'es');
    });
}

/** Minúsculas, sin tildes y sin signos: «Kaio-Ken» y «kaio ken» se buscan igual. */
export function normaliza(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// «0865» y «865» son el mismo número.
const cifra = (t) => String(Number.parseInt(t, 10));

/**
 * Lo que se escribe en el buscador, partido en palabras y números.
 * «n.º 865», «nº865», «n° 865», «#865» y «número 865» se leen como el número 865.
 */
export function preparaBusqueda(consulta) {
  let t = String(consulta ?? '').toLowerCase();
  // Lo que va delante de un número para decir que es el número.
  t = t
    .replace(/\bn\s*\.?\s*[º°o]\s*\.?\s*(?=\d)/g, ' ')
    .replace(/\bn[uú]m(?:ero)?\s*\.?\s*(?=\d)/g, ' ')
    .replace(/#\s*(?=\d)/g, ' ');
  const trozos = normaliza(t).split(' ').filter(Boolean);
  return {
    palabras: trozos.filter((x) => !/^\d+$/.test(x)),
    numeros: trozos.filter((x) => /^\d+$/.test(x)).map(cifra),
  };
}

/**
 * Lo que se guarda en cada cromo para poder buscarlo: el texto (nombre que se enseña,
 * serie y licencia) y los números (el de la pieza y los que se leen en su nombre).
 * Nunca el nombre del alta tal cual: lleva notas que no son para el cliente.
 */
export function datosDeBusqueda(pieza) {
  const texto = normaliza([pieza.nombre, pieza.serie, pieza.licencia].filter(Boolean).join(' '));
  const numeros = new Set();
  if (pieza.numero) numeros.add(cifra(pieza.numero));
  for (const x of texto.split(' ')) if (/^\d+$/.test(x)) numeros.add(cifra(x));
  return { texto, numeros: [...numeros] };
}

/**
 * ¿Sale este cromo con estos filtros?
 * - cromo: { licencia, raro, texto, numeros }
 * - filtro: { licencias: [] (vacío = todas), soloRaro, busqueda: preparaBusqueda(...) }
 * Las licencias marcadas suman (una u otra); lo demás tiene que cumplirse todo.
 * Las palabras valen a medio escribir («gok» encuentra Goku); los números, enteros
 * («86» no encuentra el 865).
 */
export function pasaFiltro(cromo, filtro) {
  const { licencias = [], soloRaro = false, busqueda = { palabras: [], numeros: [] } } = filtro;
  if (licencias.length && !licencias.includes(cromo.licencia)) return false;
  if (soloRaro && !cromo.raro) return false;
  const texto = ` ${cromo.texto} `;
  if (!busqueda.palabras.every((w) => texto.includes(w))) return false;
  if (!busqueda.numeros.every((n) => cromo.numeros.includes(n))) return false;
  return true;
}

/** El recuento que se enseña (y se anuncia a los lectores de pantalla). */
export function textoRecuento(vistos, total) {
  if (vistos === 0) return 'Ningún cromo con estos filtros';
  if (vistos === total) return `${total} ${total === 1 ? 'cromo' : 'cromos'} en el almacén`;
  return `${vistos} de ${total} cromos en el almacén`;
}
