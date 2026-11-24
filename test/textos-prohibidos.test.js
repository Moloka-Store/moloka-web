// Lo que la web no dice, en ningún sitio (Fernando, 24-nov-2026):
// - «Cartagena»: «prefiero que no se mencione Cartagena, simplemente digamos nuestro almacén».
// - Las unidades que quedan («Quedan N»): «Vale pues quita lo de quedan N».
// Se mira todo lo que acaba en la web: src/ y public/ (textos, datos y páginas).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const TEXTO = new Set(['.astro', '.js', '.ts', '.json', '.md', '.mdx', '.html', '.txt', '.css', '.xml']);

function ficheros(dir) {
  return readdirSync(dir).flatMap((n) => {
    const r = join(dir, n);
    if (statSync(r).isDirectory()) return ficheros(r);
    return TEXTO.has(extname(n)) ? [r] : [];
  });
}

const TODOS = [...ficheros(join(RAIZ, 'src')), ...ficheros(join(RAIZ, 'public'))];

test('la web no menciona Cartagena', () => {
  const con = TODOS.filter((f) => /cartagena/i.test(readFileSync(f, 'utf8')));
  assert.deepEqual(con, []);
});

test('la web no enseña las unidades que quedan («Quedan N»)', () => {
  const con = TODOS.filter((f) => /\bquedan?\s*(\d|\[n\]|\{)/i.test(readFileSync(f, 'utf8')));
  assert.deepEqual(con, []);
});
