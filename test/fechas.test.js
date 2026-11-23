import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ventanaEntrega, textoEntrega, enMadrid } from '../src/lib/fechas.js';

// Los instantes llevan su desfase escrito, para que la prueba dé lo mismo en
// cualquier ordenador. Noviembre: Madrid va a +01:00; en verano, a +02:00.
const f = (y, m, d) => ({ y, m, d });

test('lunes a las 12:59 sale ese día: llega de miércoles a viernes', () => {
  const v = ventanaEntrega(new Date('2026-11-23T12:59:00+01:00'));
  assert.deepEqual(v.sale, f(2026, 11, 23));
  assert.deepEqual(v.desde, f(2026, 11, 25));
  assert.deepEqual(v.hasta, f(2026, 11, 27));
  assert.equal(textoEntrega(v), 'Llega entre el 25 y el 27 de noviembre');
});

test('lunes a las 13:00 en punto ya no es «antes de las 13:00»', () => {
  const v = ventanaEntrega(new Date('2026-11-23T13:00:00+01:00'));
  assert.deepEqual(v.sale, f(2026, 11, 24));
});

test('lunes a las 13:01 sale el martes: llega de jueves a lunes', () => {
  const v = ventanaEntrega(new Date('2026-11-23T13:01:00+01:00'));
  assert.deepEqual(v.sale, f(2026, 11, 24));
  assert.deepEqual(v.desde, f(2026, 11, 26));
  assert.deepEqual(v.hasta, f(2026, 11, 30));
});

test('viernes por la tarde sale el lunes', () => {
  const v = ventanaEntrega(new Date('2026-11-20T18:30:00+01:00'));
  assert.deepEqual(v.sale, f(2026, 11, 23));
  assert.deepEqual(v.desde, f(2026, 11, 25));
  assert.deepEqual(v.hasta, f(2026, 11, 27));
});

test('sábado por la mañana también sale el lunes', () => {
  const v = ventanaEntrega(new Date('2026-11-21T10:00:00+01:00'));
  assert.deepEqual(v.sale, f(2026, 11, 23));
  assert.deepEqual(v.hasta, f(2026, 11, 27));
});

test('domingo sale el lunes', () => {
  const v = ventanaEntrega(new Date('2026-11-22T09:00:00+01:00'));
  assert.deepEqual(v.sale, f(2026, 11, 23));
});

test('cambio de mes: el texto nombra los dos meses', () => {
  // Jueves 26-nov a las 10:00: sale ese día, llega del lunes 30-nov al miércoles 2-dic.
  const v = ventanaEntrega(new Date('2026-11-26T10:00:00+01:00'));
  assert.deepEqual(v.desde, f(2026, 11, 30));
  assert.deepEqual(v.hasta, f(2026, 12, 2));
  assert.equal(textoEntrega(v), 'Llega entre el 30 de noviembre y el 2 de diciembre');
});

test('cambio de año (sin festivos: el 1 de enero cuenta como laborable)', () => {
  const v = ventanaEntrega(new Date('2026-12-30T11:00:00+01:00'));
  assert.deepEqual(v.desde, f(2027, 1, 1));
  assert.deepEqual(v.hasta, f(2027, 1, 5));
  assert.equal(textoEntrega(v), 'Llega entre el 1 y el 5 de enero');
  const w = ventanaEntrega(new Date('2026-12-29T11:00:00+01:00'));
  assert.equal(textoEntrega(w), 'Llega entre el 31 de diciembre y el 4 de enero');
});

test('manda la hora de Madrid, no la del ordenador', () => {
  // 11:30 en UTC son las 12:30 en Madrid en noviembre (antes del corte)…
  assert.deepEqual(ventanaEntrega(new Date('2026-11-23T11:30:00Z')).sale, f(2026, 11, 23));
  // …y 12:30 en UTC son las 13:30 en Madrid (después del corte).
  assert.deepEqual(ventanaEntrega(new Date('2026-11-23T12:30:00Z')).sale, f(2026, 11, 24));
  // Pasada la medianoche de Madrid ya es el día siguiente, aunque en UTC no.
  assert.deepEqual(enMadrid(new Date('2026-11-23T23:30:00Z')), { y: 2026, m: 11, d: 24, h: 0, min: 30 });
});

test('en verano Madrid va a +02:00', () => {
  // Lunes 6-jul-2026: 10:59 UTC son las 12:59 en Madrid; 11:01 UTC, las 13:01.
  assert.deepEqual(ventanaEntrega(new Date('2026-07-06T10:59:00Z')).sale, f(2026, 7, 6));
  assert.deepEqual(ventanaEntrega(new Date('2026-07-06T11:01:00Z')).sale, f(2026, 7, 7));
});
