// Lo que se puede sacar del nombre de una pieza, y nada más.
//
// Los nombres llegan como los escribió quien dio de alta la pieza
// («DBZ Super Saiyan Goku with Energy 865 CHASE»). De ahí se saca:
// - el número, solo cuando es inequívoco (un único número suelto);
// - la serie y su licencia, solo si una palabra del nombre está en la tabla de abajo;
// - un nombre para enseñar, quitando lo que no es el nombre (marca, formato, «CHASE»…).
// Lo que no se puede sacar así se queda vacío: no se adivina.
// Funciones puras, sin datos: las prueba `node --test` (test/nombres.test.js).

// Tabla de series. Cada fila: la expresión que tiene que aparecer TAL CUAL en el
// nombre, la serie que se enseña y la licencia (la hoja del álbum); `seQueda` cuando
// esa palabra es parte del nombre de la figura y no se quita al limpiarlo. Va en orden:
// gana la primera que encaja. Una pieza cuyo nombre no lleva ninguna se queda sin serie.
export const SERIES = [
  [/\bDBGT\b/i, 'Dragon Ball GT', 'Dragon Ball'],
  [/\bDBS\b/i, 'Dragon Ball Super', 'Dragon Ball'],
  [/\bDBZ\b/i, 'Dragon Ball Z', 'Dragon Ball'],
  [/\bDragon Ball Z\b/i, 'Dragon Ball Z', 'Dragon Ball'],
  [/\bDan Da Dan\b/i, 'Dan Da Dan', 'Dan Da Dan'],
  [/\bOne Piece\b/i, 'One Piece', 'One Piece'],
  [/\bNaruto\b/i, 'Naruto', 'Naruto'],
  [/\bBleach\b/i, 'Bleach', 'Bleach'],
  [/\bDemon Slayer\b/i, 'Demon Slayer', 'Demon Slayer'],
  [/\bAttack on Titan\b/i, 'Attack on Titan', 'Attack on Titan'],
  [/\bStranger Things\b/i, 'Stranger Things', 'Stranger Things'],
  [/\bFriends\b/, 'Friends', 'Friends'],
  [/\bLOTR\b/, 'El Señor de los Anillos', 'El Señor de los Anillos'],
  [/\bHouse of the Dragon\b/i, 'La Casa del Dragón', 'Juego de Tronos'],
  [/\bHarry Potter\b/i, 'Harry Potter', 'Harry Potter'],
  [/\bStar Wars\b/i, 'Star Wars', 'Star Wars'],
  [/\bMarvel Rivals\b/i, 'Marvel Rivals', 'Marvel'],
  [/\bDeadpool & Wolverine\b/i, 'Deadpool y Lobezno', 'Marvel'],
  [/\bInfinity Saga\b/i, 'Infinity Saga', 'Marvel'],
  [/\bBatman Beyond\b/i, 'Batman Beyond', 'DC'],
  [/\bBatman Returns\b/i, 'Batman vuelve', 'DC'],
  [/\bBatman\/Superman\b/i, 'Batman/Superman', 'DC', { seQueda: true }],
  [/\bD&D\b/, 'Dungeons & Dragons', 'Dungeons & Dragons'],
  [/\bHello Kitty\b/i, 'Hello Kitty', 'Sanrio'],
  [/\bRick and Morty\b/i, 'Rick y Morty', 'Rick y Morty'],
  [/\bFallout\b/i, 'Fallout', 'Fallout'],
  [/\bNosferatu\b/i, 'Nosferatu', 'Nosferatu'],
  [/\bGodfather\b/i, 'El Padrino', 'El Padrino', { seQueda: true }],
  [/^Ghost\b/, 'Ghost', 'Música'],
  [/\bAC\/DC\b/, 'AC/DC', 'Música'],
  [/\bAerosmith\b/i, 'Aerosmith', 'Música'],
  [/\bLakers\b/i, 'NBA · Lakers', 'Deporte'],
  [/\bPSG\b/, 'Fútbol · PSG', 'Deporte'],
  [/\bShrek\b/i, 'Shrek', 'Shrek', { seQueda: true }],
  [/\bSpongeBob\b/i, 'Bob Esponja', 'Bob Esponja', { seQueda: true }],
  [/\bTMNT\b/, 'Tortugas Ninja', 'Tortugas Ninja'],
];

/** Serie y licencia que da la tabla, o null si el nombre no lleva ninguna. */
export function serieDe(nombre) {
  for (const [re, serie, licencia, op = {}] of SERIES) {
    if (re.test(nombre)) return { serie, licencia, re, seQueda: !!op.seQueda };
  }
  return null;
}

// Lo que va entre paréntesis («(Summer Con 2024)», «(GW)») y las medidas («9 cm»)
// no son el número de la pieza.
function sinRuido(nombre) {
  return nombre.replace(/\([^)]*\)/g, ' ').replace(/\*[^*]*\*/g, ' ').replace(/\b\d+\s*cm\b/gi, ' ');
}

// Un número suelto: de 1 a 4 cifras, sin letras ni signos pegados
// («50th», «S4», «5+1» no cuentan).
const SUELTO = /(?<![\w+\/.,-])\d{1,4}(?![\w+\/.,-])/g;

/** El número de la pieza si el nombre lo dice sin duda; si no, null. */
export function numeroDe(nombre) {
  const limpio = sinRuido(nombre);
  const conMarca = limpio.match(/N°\s*(\d{1,4})\b/i);
  if (conMarca) return conMarca[1];
  const sueltos = limpio.match(SUELTO) || [];
  return sueltos.length === 1 ? sueltos[0] : null;
}

// Lo que se quita al enseñar el nombre, regla a regla. Nada más: lo que no esté
// aquí se enseña tal cual, paréntesis incluidos («(Summer Con 2024)»).
// - Notas del alta que no son el nombre: «(anuncio Chase)», «(GW)», «(MT)», «(DGLT)»,
//   «(Exc)», «(CHASE)» y «Case 5+1 Chase».
// - Marca y formato: «Funko», «POP!», «Vinyl», «Figura», «Animation», «Movies»,
//   «Rocks», «Convention», «Metallic».
// - La marca de chase («CHASE», «SE»): la rareza se enseña aparte, con el dato `es_chase`.
const QUITAR = [
  /\(anuncio Chase\)/gi,
  /\((?:GW|MT|DGLT|Exc|CHASE)\)/gi,
  /\bCase 5\+1 Chase\b/gi,
  /\bFunko\b/gi,
  /\bPOP!?(?=\s|$|-)/gi,
  /\bVinyl\b/gi,
  /\bFigura\b/gi,
  /\bAnimation\b/gi,
  /\bMovies\b/gi,
  /\bRocks\b/gi,
  /\bConvention\b/gi,
  /\bMetallic\b/gi,
  /\bCHASE\b/gi,
  /\bSE\b/g,
];

function capitalizar(texto) {
  return texto.toLowerCase().replace(/(^|[\s/-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
}

/** El nombre para enseñar: el del alta sin notas, marca, formato, número, serie ni «CHASE». */
export function nombreLimpio(nombre) {
  let t = nombre.replace(/N°\s*\d{1,4}\b/gi, ' ');
  const s = serieDe(nombre);
  if (s && !s.seQueda) {
    const sinSerie = t.replace(new RegExp(s.re.source, s.re.flags.replace('g', '')), ' ');
    // «Naruto on Gamakichi»: si lo que queda empieza en minúscula, la serie era parte del nombre.
    const resto = sinSerie.replace(/\bFunko\b|\bPOP!?/gi, ' ');
    if (!/^[\s\-–·:]*\p{Ll}/u.test(resto)) t = sinSerie;
  }
  for (const re of QUITAR) t = t.replace(re, ' ');
  const num = numeroDe(nombre);
  if (num) t = t.replace(new RegExp(`(?<![\\w+/.,-])${num}(?![\\w+/.,-])`), ' ');
  t = t
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–·:]+|[\s\-–·:]+$/g, '')
    .replace(/\s+-\s+/g, ' ')
    .replace(/\s+w\/$/i, '')
    .trim();
  if (!t) return nombre.trim();
  // Todo en mayúsculas («SNIPER KING») se pasa a nombre propio; lo demás se deja.
  if (t === t.toUpperCase() && /\p{L}{3}/u.test(t)) t = capitalizar(t);
  return t;
}
