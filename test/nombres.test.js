import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numeroDe, serieDe, nombreLimpio } from '../src/lib/nombres.js';

test('número: un único número suelto', () => {
  assert.equal(numeroDe('DBS Super Saiyan God Vegeta 1868 CHASE'), '1868');
  assert.equal(numeroDe('PSG Lionel Messi 50'), '50');
  assert.equal(numeroDe('POP! Vinyl - 1240 DUSTIN'), '1240');
  assert.equal(numeroDe('FUNKO POP Stranger Things S4 Eleven 1457 CHASE'), '1457');
});

test('número: «N°» delante lo hace inequívoco', () => {
  assert.equal(numeroDe('DRAGON BALL Z - POP N° 948 - SSGoku w/KamehmaWve (DGLT)'), '948');
});

test('número: no cuentan años entre paréntesis, «50th», «5+1» ni medidas', () => {
  assert.equal(numeroDe('FUNKO POP The Godfather 50th Vito 1200'), '1200');
  assert.equal(numeroDe('D&D Lord Soth 979 (Summer Con 2024)'), '979');
  assert.equal(numeroDe('POP! Case 5+1 Chase - Ochaco Uraraka Case 5+1 Chase (CHASE)'), null);
  assert.equal(numeroDe('Aerosmith POP! Rocks Vinyl Figura Steven Tyler (Leopard Outfit) Exclusive Edition 9 cm'), null);
});

test('número: si hay más de uno, no se adivina', () => {
  assert.equal(numeroDe('DBGT Super Saiyan 4 Gogeta 2074 CHASE'), null);
  assert.equal(numeroDe('FUNKO POP DBZ Super Buu With Ghost CHASE'), null);
});

test('serie: solo si una palabra de la tabla está en el nombre', () => {
  assert.deepEqual(
    (({ serie, licencia }) => ({ serie, licencia }))(serieDe('DBZ Super Saiyan Goku with Energy 865 CHASE')),
    { serie: 'Dragon Ball Z', licencia: 'Dragon Ball' },
  );
  assert.equal(serieDe('LOTR Eowyn 1743 CHASE').serie, 'El Señor de los Anillos');
  assert.equal(serieDe('Funko Pop! Gohan Beast CHASE'), null);
  assert.equal(serieDe('Tails Flocked 978 CHASE'), null);
  // «With Ghost» no es la banda Ghost: esa solo cuenta al principio del nombre.
  assert.equal(serieDe('FUNKO POP DBZ Super Buu With Ghost CHASE').serie, 'Dragon Ball Z');
  assert.equal(serieDe('Ghost Papa Emeritus IV 336').serie, 'Ghost');
});

test('nombre limpio: sin marca, formato, número, serie ni «CHASE»', () => {
  assert.equal(nombreLimpio('DBS Super Saiyan God Vegeta 1868 CHASE'), 'Super Saiyan God Vegeta');
  assert.equal(nombreLimpio('FUNKO POP One Piece Roronoa Zoro w/ 1775 CHASE'), 'Roronoa Zoro');
  assert.equal(nombreLimpio('POP! Case 5+1 Chase - Ochaco Uraraka Case 5+1 Chase (CHASE)'), 'Ochaco Uraraka');
  assert.equal(nombreLimpio('FUNKO POP ONE PIECE SNIPER KING 1514'), 'Sniper King');
  assert.equal(nombreLimpio('POP! Vinyl - Unmasked Obito (Exc)'), 'Unmasked Obito');
});

test('nombre limpio: la serie se queda cuando es parte del nombre', () => {
  assert.equal(nombreLimpio('Naruto on Gamakichi 106 (Rides)'), 'Naruto on Gamakichi (Rides)');
  assert.equal(nombreLimpio('FUNKO POP The Godfather 50th Vito 1200'), 'The Godfather 50th Vito');
});

test('nombre limpio: se quitan solo las notas de la lista; los demás paréntesis se quedan', () => {
  assert.equal(nombreLimpio('AC/DC POP! Rocks Angus Young CHASE (anuncio Chase)'), 'Angus Young');
  assert.equal(nombreLimpio('Funko POP! Vinyl (Exc) DBZ- Goku Yardrat (GW) CHASE'), 'Goku Yardrat');
  assert.equal(nombreLimpio('POP! Metallic - I Am Iron Man (MT) (GW)'), 'I Am Iron Man');
  assert.equal(nombreLimpio('DRAGON BALL Z - POP N° 948 - SSGoku w/KamehmaWve (DGLT)'), 'SSGoku w/KamehmaWve');
  assert.equal(nombreLimpio('Batman/Superman Fusion 506 (Summer Con 2024)'), 'Batman/Superman Fusion (Summer Con 2024)');
  assert.equal(nombreLimpio('D&D Lord Soth 979 (Summer Con 2024)'), 'Lord Soth (Summer Con 2024)');
});
