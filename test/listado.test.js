import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OTRAS, ordenListado, licenciaDe, licenciasDe, normaliza, preparaBusqueda,
  datosDeBusqueda, pasaFiltro, textoRecuento,
} from '../src/lib/listado.js';

const pieza = (o) => ({ nombre: 'X', numero: null, serie: null, licencia: null, esChase: false, ...o });

test('orden: primero lo raro y después lo demás, cada grupo en su orden', () => {
  const lista = [
    pieza({ nombre: 'a' }), pieza({ nombre: 'b', esChase: true }),
    pieza({ nombre: 'c' }), pieza({ nombre: 'd', esChase: true }),
  ];
  assert.deepEqual(ordenListado(lista).map((p) => p.nombre), ['b', 'd', 'a', 'c']);
});

test('licencias: sin licencia va en «Otras», que sale la última', () => {
  assert.equal(licenciaDe(pieza({})), OTRAS);
  const lista = [
    pieza({ licencia: 'Naruto' }), pieza({}), pieza({}), pieza({}),
    pieza({ licencia: 'Dragon Ball' }), pieza({ licencia: 'Dragon Ball' }),
  ];
  assert.deepEqual(licenciasDe(lista), [
    { licencia: 'Dragon Ball', n: 2 }, { licencia: 'Naruto', n: 1 }, { licencia: OTRAS, n: 3 },
  ]);
});

test('normaliza: sin tildes, sin mayúsculas y sin signos', () => {
  assert.equal(normaliza('Fútbol · PSG'), 'futbol psg');
  assert.equal(normaliza('SSGSS Goku Kaio-Ken'), 'ssgss goku kaio ken');
  assert.equal(normaliza(null), '');
});

test('búsqueda: el número, escrito de varias formas', () => {
  for (const q of ['865', 'n.º 865', 'nº865', 'N° 865', 'no. 865', '#865', 'número 865', 'num 865', '0865']) {
    assert.deepEqual(preparaBusqueda(q), { palabras: [], numeros: ['865'] }, q);
  }
});

test('búsqueda: palabras y número a la vez; las palabras, sin tildes', () => {
  assert.deepEqual(preparaBusqueda('Goku n.º 865'), { palabras: ['goku'], numeros: ['865'] });
  assert.deepEqual(preparaBusqueda('  Bob Esponja  '), { palabras: ['bob', 'esponja'], numeros: [] });
  assert.deepEqual(preparaBusqueda('Señor'), { palabras: ['senor'], numeros: [] });
  assert.deepEqual(preparaBusqueda(''), { palabras: [], numeros: [] });
});

test('búsqueda: «no» o «n» sin número detrás siguen siendo palabras', () => {
  assert.deepEqual(preparaBusqueda('nami'), { palabras: ['nami'], numeros: [] });
  assert.deepEqual(preparaBusqueda('no way home'), { palabras: ['no', 'way', 'home'], numeros: [] });
});

test('datos de búsqueda: nombre que se enseña, serie y licencia; el número y los del nombre', () => {
  const d = datosDeBusqueda(pieza({ nombre: 'Super Saiyan Goku with Energy', numero: '865', serie: 'Dragon Ball Z', licencia: 'Dragon Ball' }));
  assert.equal(d.texto, 'super saiyan goku with energy dragon ball z dragon ball');
  assert.deepEqual(d.numeros, ['865']);
  // Sin número inequívoco, los números que se leen en el nombre también se encuentran.
  const g = datosDeBusqueda(pieza({ nombre: 'Super Saiyan 4 Gogeta 2074' }));
  assert.deepEqual(g.numeros, ['4', '2074']);
});

test('filtro: licencias marcadas (una u otra), solo lo raro y búsqueda, todo a la vez', () => {
  const cromo = { licencia: 'Dragon Ball', raro: true, texto: 'super saiyan goku dragon ball z dragon ball', numeros: ['865'] };
  const nada = preparaBusqueda('');
  assert.equal(pasaFiltro(cromo, {}), true);
  assert.equal(pasaFiltro(cromo, { licencias: ['Naruto', 'Dragon Ball'] }), true);
  assert.equal(pasaFiltro(cromo, { licencias: ['Naruto'] }), false);
  assert.equal(pasaFiltro({ ...cromo, raro: false }, { soloRaro: true, busqueda: nada }), false);
  assert.equal(pasaFiltro(cromo, { busqueda: preparaBusqueda('gok') }), true);
  assert.equal(pasaFiltro(cromo, { busqueda: preparaBusqueda('goku vegeta') }), false);
  assert.equal(pasaFiltro(cromo, { busqueda: preparaBusqueda('n.º 865') }), true);
  // El número va entero: «86» no es el 865, ni «1865».
  assert.equal(pasaFiltro(cromo, { busqueda: preparaBusqueda('86') }), false);
  assert.equal(pasaFiltro(cromo, { busqueda: preparaBusqueda('1865') }), false);
  assert.equal(pasaFiltro(cromo, { licencias: ['Dragon Ball'], soloRaro: true, busqueda: preparaBusqueda('goku 865') }), true);
});

test('recuento: «N en el almacén», «N de M» o ninguno', () => {
  assert.equal(textoRecuento(74, 74), '74 cromos en el almacén');
  assert.equal(textoRecuento(1, 1), '1 cromo en el almacén');
  assert.equal(textoRecuento(12, 74), '12 de 74 cromos en el almacén');
  assert.equal(textoRecuento(0, 74), 'Ningún cromo con estos filtros');
});
