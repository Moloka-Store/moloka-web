// Qué día llega una pieza del almacén (decidido por Fernando el 23-nov-2026):
// pedido antes de las 13:00 de lunes a viernes, sale ese día; si no, sale el
// siguiente día laborable. Llega entre 2 y 4 días laborables después de salir.
// Todo en hora de Madrid. Sin festivos por ahora: un festivo cuenta como laborable.
//
// Se calcula en el navegador (el sitio es estático: calculado al construir se
// quedaría congelado). Funciones puras: las prueba `node --test` (test/fechas.test.js).

export const REGLA_ALMACEN = { horaCorte: 13, minimo: 2, maximo: 4 };

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const RELOJ_MADRID = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Madrid',
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
});

/** Fecha y hora de Madrid de un instante: { y, m (1-12), d, h, min }. */
export function enMadrid(instante) {
  const p = {};
  for (const { type, value } of RELOJ_MADRID.formatToParts(instante)) p[type] = Number(value);
  return { y: p.year, m: p.month, d: p.day, h: p.hour, min: p.minute };
}

// Los días se cuentan sobre fechas «de calendario» (sin hora ni zona), en UTC.
const dia = ({ y, m, d }) => new Date(Date.UTC(y, m - 1, d));
const aFecha = (t) => ({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() });
const esLaborable = (t) => t.getUTCDay() >= 1 && t.getUTCDay() <= 5;
const masUnDia = (t) => new Date(t.getTime() + 86400000);

function sumarLaborables(t, n) {
  let x = t;
  for (let i = 0; i < n; ) {
    x = masUnDia(x);
    if (esLaborable(x)) i++;
  }
  return x;
}

/**
 * Ventana de entrega de lo que está en el almacén, para un pedido hecho en `instante`.
 * Devuelve { sale, desde, hasta } como fechas de calendario { y, m, d }.
 */
export function ventanaEntrega(instante = new Date(), regla = REGLA_ALMACEN) {
  const ahora = enMadrid(instante);
  let sale = dia(ahora);
  if (!(esLaborable(sale) && ahora.h < regla.horaCorte)) {
    do sale = masUnDia(sale); while (!esLaborable(sale));
  }
  return {
    sale: aFecha(sale),
    desde: aFecha(sumarLaborables(sale, regla.minimo)),
    hasta: aFecha(sumarLaborables(sale, regla.maximo)),
  };
}

/** «Llega entre el 25 y el 27 de noviembre» / «… el 30 de noviembre y el 2 de diciembre». */
export function textoEntrega({ desde, hasta }) {
  const primero = desde.m === hasta.m && desde.y === hasta.y
    ? `${desde.d}`
    : `${desde.d} de ${MESES[desde.m - 1]}`;
  return `Llega entre el ${primero} y el ${hasta.d} de ${MESES[hasta.m - 1]}`;
}
