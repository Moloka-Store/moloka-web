import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  aPieza, catalogoDe, slugDe, direccionesDe, cajaEspecial, protectorDe, figuraVisible, CESION_CONFIRMADA,
} from '../src/lib/pieza.js';

const leer = (r) => JSON.parse(readFileSync(new URL(r, import.meta.url), 'utf8'));
const DATOS = leer('../src/data/catalogo.json');
const FICHAS = leer('../src/data/fichas.json');
const BUU = DATOS.piezas.find((p) => p.clave === '889698715560-chase');

// ── El interruptor de las fotos de la figura ────────────────────────────────────

test('interruptor apagado (en obras): la figura se enseña y el cromo arranca con ella', () => {
  const p = aPieza(BUU, { figuraSoloConCesion: false });
  assert.ok(p.fotos.figura && /_figura_/.test(p.fotos.figura.url));
  assert.equal(p.vistaInicial, 'figura');
  const todas = catalogoDe(DATOS.piezas, { fichas: FICHAS, figuraSoloConCesion: false });
  assert.equal(todas.filter((x) => x.fotos.figura).length, 41);
});

test('interruptor puesto (lanzamiento): sin cesión confirmada no hay figura y arranca con el montaje', () => {
  const p = aPieza(BUU, { figuraSoloConCesion: true });
  assert.equal(p.fotos.figura, null);
  assert.equal(p.vistaInicial, 'montaje');
  // Ninguna foto de figura llega a las páginas: hoy todas están «por averiguar».
  const todas = catalogoDe(DATOS.piezas, { fichas: FICHAS, figuraSoloConCesion: true });
  assert.equal(todas.filter((x) => x.fotos.figura).length, 0);
  assert.ok(!JSON.stringify(todas).includes('_figura_'));
});

test('interruptor puesto: con la cesión confirmada, la figura sí se enseña', () => {
  const confirmada = {
    ...BUU,
    fotos_web: BUU.fotos_web.map((f) => (f.tipo === 'figura' ? { ...f, cesion: CESION_CONFIRMADA } : f)),
  };
  const p = aPieza(confirmada, { figuraSoloConCesion: true });
  assert.ok(p.fotos.figura);
  assert.equal(p.vistaInicial, 'figura');
});

test('cesión: solo el valor confirmado vale; lo demás esconde la foto', () => {
  for (const cesion of ['por_averiguar', null, undefined, '', 'CONFIRMADA', 'si']) {
    assert.equal(figuraVisible({ url: 'x', cesion }, true), false, String(cesion));
    assert.equal(figuraVisible({ url: 'x', cesion }, false), true, String(cesion));
  }
  assert.equal(figuraVisible({ url: '', cesion: CESION_CONFIRMADA }, false), false);
});

test('el interruptor es una sola línea en catalogo.js', () => {
  const fuente = readFileSync(new URL('../src/lib/catalogo.js', import.meta.url), 'utf8');
  const lineas = fuente.split('\n').filter((l) => /FIGURA_SOLO_CON_CESION\s*=/.test(l));
  assert.equal(lineas.length, 1);
  assert.match(lineas[0], /^export const FIGURA_SOLO_CON_CESION = (true|false);\s*$/);
});

// ── Con qué arranca el cromo ────────────────────────────────────────────────────

test('vista inicial: figura, si no montaje, si no caja, si no «foto por hacer»', () => {
  const base = { clave: 'k', nombre: 'Funko POP Naruto Kakashi 822', es_chase: false, fotos_web: [], fotos_caja: [] };
  const figura = { tipo: 'figura', url: 'f', cesion: 'por_averiguar' };
  const montaje = { tipo: 'montaje', url: 'm' };
  const frente = { tipo: 'frente', url: 'c' };
  const culo = { tipo: 'culo', url: 'b' };
  assert.equal(aPieza({ ...base }).vistaInicial, null);
  assert.equal(aPieza({ ...base, fotos_caja: [{ tipo: 'frente', url: '' }, frente] }).vistaInicial, 'caja');
  assert.equal(aPieza({ ...base, fotos_caja: [culo] }).vistaInicial, 'base');
  assert.equal(aPieza({ ...base, fotos_web: [montaje], fotos_caja: [frente] }).vistaInicial, 'montaje');
  const todo = aPieza({ ...base, fotos_web: [figura, montaje], fotos_caja: [frente, culo] }, { figuraSoloConCesion: false });
  assert.equal(todo.vistaInicial, 'figura');
  assert.deepEqual(Object.keys(todo.fotos), ['caja', 'figura', 'montaje', 'base']);
  assert.equal(todo.fotos.base.url, 'b');
});

// ── La dirección ────────────────────────────────────────────────────────────────

test('dirección: nombre limpio, número y «chase»', () => {
  assert.equal(slugDe({ nombre: 'Super Buu With Ghost', numero: '1464', esChase: true }), 'super-buu-with-ghost-1464-chase');
  assert.equal(slugDe({ nombre: 'Eleven w/Eggos', numero: '421', esChase: true }), 'eleven-with-eggos-421-chase');
  assert.equal(slugDe({ nombre: 'King Kai & Bubbles', numero: null, esChase: false }), 'king-kai-bubbles');
  assert.equal(slugDe({ nombre: 'Éowyn', numero: '1743', esChase: false }), 'eowyn-1743');
  // El número no se repite si el nombre ya lo lleva.
  assert.equal(slugDe({ nombre: 'Super Saiyan 4 Gogeta 2074', numero: '2074', esChase: true }), 'super-saiyan-4-gogeta-2074-chase');
});

test('dirección: si chocan, la segunda lleva el código de barras; si aun así chocan, error', () => {
  const a = { clave: 'a', nombre: 'Goku', numero: null, esChase: false, ean: '111' };
  const b = { clave: 'b', nombre: 'Goku', numero: null, esChase: false, ean: '222' };
  const d = direccionesDe([a, b]);
  assert.equal(d.get('a'), 'goku');
  assert.equal(d.get('b'), 'goku-222');
  assert.throws(() => direccionesDe([a, { ...a, clave: 'c' }, { ...a, clave: 'e' }]));
  assert.throws(() => direccionesDe([{ clave: 'z', nombre: '¡!', numero: null, esChase: false }]));
});

test('dirección: única y no vacía en las 74 piezas; la de Super Buu, la del estudio', () => {
  const todas = catalogoDe(DATOS.piezas, { fichas: FICHAS, figuraSoloConCesion: false });
  assert.equal(todas.length, 74);
  const urls = todas.map((p) => p.url);
  assert.equal(new Set(urls).size, 74);
  for (const u of urls) assert.match(u, /^\/funko\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
  for (const p of todas.filter((x) => x.esChase)) assert.match(p.url, /-chase$/);
  assert.equal(todas.find((p) => p.clave === BUU.clave).url, '/funko/super-buu-with-ghost-1464-chase');
});

// ── El protector ────────────────────────────────────────────────────────────────

test('protector: incluido en lo raro, casilla en lo normal y nada en los formatos grandes', () => {
  assert.equal(protectorDe({ esChase: true, nombre: 'Goku' }), 'incluido');
  assert.equal(protectorDe({ esChase: false, nombre: 'Goku' }), 'opcional');
  assert.equal(protectorDe({ esChase: false, nombre: 'Naruto on Gamakichi 106 (Rides)' }), null);
  assert.equal(protectorDe({ esChase: true, nombre: 'X Deluxe' }), null);
  for (const n of ['X Deluxe', 'X Jumbo', 'X Town', 'X Moment', 'X 25 cm', 'X 25cm']) assert.equal(cajaEspecial(n), true, n);
  assert.equal(cajaEspecial('Steven Tyler 9 cm'), false);
});

test('protector: las medidas del paquete (caja_cm) no cuentan', () => {
  const todas = catalogoDe(DATOS.piezas, { fichas: FICHAS, figuraSoloConCesion: false });
  const sin = todas.filter((p) => !p.protector).map((p) => p.url);
  assert.deepEqual(sin, ['/funko/naruto-on-gamakichi-rides-106']);
  const eleven = todas.find((p) => p.clave === '889698133180-chase');
  assert.equal(eleven.protector, 'incluido');
});

// ── Lo escrito de cada pieza ────────────────────────────────────────────────────

test('lo escrito: solo Super Buu lleva; el número del dibujo solo entra si el nombre no lo da', () => {
  const claves = Object.keys(FICHAS).filter((k) => !k.startsWith('_'));
  assert.deepEqual(claves, [BUU.clave]);
  const todas = catalogoDe(DATOS.piezas, { fichas: FICHAS, figuraSoloConCesion: false });
  const buu = todas.find((p) => p.clave === BUU.clave);
  assert.equal(buu.numero, '1464');
  assert.equal(buu.anio, 2023);
  assert.equal(buu.escrito.pegatinas.length, 1);
  assert.equal(todas.filter((p) => p.escrito).length, 1);
  // Un número en el nombre manda sobre el escrito.
  const conNumero = aPieza({ clave: 'k', nombre: 'Goku 865', fotos_web: [] }, { escrito: { numero: '1' } });
  assert.equal(conNumero.numero, '865');
});

test('lo escrito: en lo escrito no hay precios ni huecos por rellenar', () => {
  const cadenas = [];
  const recorrer = (v) => {
    if (typeof v === 'string') cadenas.push(v);
    else if (v && typeof v === 'object') Object.values(v).forEach(recorrer);
  };
  recorrer(FICHAS);
  for (const s of cadenas) {
    assert.ok(!/€|\d+,\d{2}/.test(s), s);
    assert.ok(!/[[\]]/.test(s), s);
  }
});

// ── Las fotos de fotos-extra.json ───────────────────────────────────────────────
import { existsSync } from 'node:fs';
import { extrasDe, ORIGEN_FABRICANTE, ORIGEN_NUESTRA } from '../src/lib/pieza.js';
const EXTRAS = leer('../src/data/fotos-extra.json');

test('fotos extra: sustituyen a la de la base y dicen de quién son', () => {
  const p = aPieza(BUU, { extra: EXTRAS[BUU.clave], figuraSoloConCesion: false });
  assert.equal(p.fotos.figura.url, '/fotos/889698715560-chase-figura.jpg');
  assert.equal(p.fotos.figura.origen, ORIGEN_FABRICANTE);
  assert.equal(p.fotos.caja.origen, ORIGEN_FABRICANTE);
  assert.equal(p.fotos.base.origen, ORIGEN_NUESTRA);
  assert.equal(p.vistaInicial, 'figura');
  // Sin extra, la figura de la base sigue ahí, como imagen de fábrica.
  const sin = aPieza(BUU, { figuraSoloConCesion: false });
  assert.ok(/_figura_/.test(sin.fotos.figura.url));
  assert.equal(sin.fotos.figura.origen, null); // la base no dice de quién es
});

test('fotos extra: con el interruptor puesto, la figura extra sin cesión confirmada tampoco sale', () => {
  const p = aPieza(BUU, { extra: EXTRAS[BUU.clave], figuraSoloConCesion: true });
  assert.equal(p.fotos.figura, null);
  assert.ok(p.fotos.caja && p.fotos.base);
});

test('fotos extra: se ignora lo que no se entiende', () => {
  const x = extrasDe({ figura: { url: '/a.jpg', fuente: 'x' }, caja: { url: '', origen: 'nuestra', fuente: 'almacén' }, base: { url: '/b.jpg', origen: 'otra', fuente: 'x' } });
  assert.deepEqual(x, { figura: null, caja: null, base: null });
  // Sin fuente no entra: «fabricante» tiene que poder comprobarse.
  assert.equal(extrasDe({ figura: { url: '/a.jpg', origen: 'fabricante' } }).figura, null);
});

test('fotos extra: cada clave existe en el catálogo y cada fichero está en public/', () => {
  const claves = new Set(DATOS.piezas.map((p) => p.clave));
  for (const [clave, fotos] of Object.entries(EXTRAS)) {
    if (clave.startsWith('_')) continue;
    assert.ok(claves.has(clave), `clave sin pieza: ${clave}`);
    for (const [tipo, f] of Object.entries(fotos)) {
      assert.ok(existsSync(new URL(`../public${f.url}`, import.meta.url)), `falta ${f.url}`);
      assert.ok(typeof f.fuente === 'string' && f.fuente.trim(), `${clave} ${tipo}: sin fuente`);
      if (f.origen === ORIGEN_FABRICANTE) assert.match(f.fuente, /https?:\/\//, `${clave} ${tipo}: la fuente de fábrica lleva su dirección`);
      if (f.origen === ORIGEN_NUESTRA) assert.equal(f.fuente, 'almacén', `${clave} ${tipo}`);
    }
  }
});

// ── El precio de la web (precios-web.json) ──────────────────────────────────────
const PRECIOS = leer('../src/data/precios-web.json');

test('precio de la web: manda sobre el de la copia y, sin él, queda el de la copia', () => {
  const vito = DATOS.piezas.find((p) => p.clave === '889698615297');
  assert.equal(vito.precio_venta, 22.99);
  const conWeb = aPieza(vito, { precioWeb: PRECIOS[vito.clave] });
  assert.equal(conWeb.precio, 15.95);
  assert.equal(conWeb.precioTexto, '15,95 €');
  assert.equal(aPieza(vito).precio, 22.99);
  assert.equal(aPieza(BUU).precio, null);
});

test('precio de la web: cada clave tiene pieza, cada precio acaba en ,95 y los chase van en sus escalones', () => {
  const porClave = new Map(DATOS.piezas.map((p) => [p.clave, p]));
  for (const [clave, precio] of Object.entries(PRECIOS)) {
    if (clave.startsWith('_')) continue;
    assert.ok(porClave.has(clave), `clave sin pieza: ${clave}`);
    assert.ok(Number.isFinite(precio) && Math.round(precio * 100) % 100 === 95, `${clave}: ${precio}`);
    if (porClave.get(clave).es_chase) assert.ok(precio === 29.95 || precio === 34.95 || precio >= 44.95, `chase ${clave}: ${precio}`);
  }
  const todas = catalogoDe(DATOS.piezas, { fichas: FICHAS, precios: PRECIOS, figuraSoloConCesion: false });
  // Sin precio todavía: Reiner Braun 1996 y Angus Young (¿chase o normal en la web?).
  assert.deepEqual(todas.filter((p) => p.precio == null).map((p) => p.clave).sort(), ['889698363181', '889698828451']);
});
