import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as acorn from './vendor/acorn.mjs';
import * as walk from './vendor/acorn-walk.mjs';

// Las tablets del colegio (Galaxy Tab A 8.0, 2019) traen Android 9 con un Chrome de fábrica de 2019.
// Si el código usa sintaxis más nueva, el módulo no carga y la app se queda en «Cargando…».
// Piso: Chrome 74. Se permiten import() dinámico (Chrome 63) y globalThis (Chrome 71).
const archivos = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? archivos(join(d, e.name)) : e.name.endsWith('.js') ? [join(d, e.name)] : []);
const app = [...archivos('js'), 'sw.js'];

const API_NUEVAS = {
  structuredClone: 98, replaceChildren: 86, at: 92, replaceAll: 85, findLast: 97, findLastIndex: 97,
  hasOwn: 93, toSorted: 110, toReversed: 110, any: 85, groupBy: 117,
};

function problemas(archivo) {
  const src = readFileSync(archivo, 'utf8');
  const lista = [];
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: archivo === 'sw.js' ? 'script' : 'module', locations: true });
  const marca = (que, n) => lista.push(`${archivo}:${n.loc.start.line} ${que}`);
  walk.full(ast, n => {
    if (n.type === 'ChainExpression') marca('?. necesita Chrome 80', n);
    if (n.type === 'LogicalExpression' && n.operator === '??') marca('?? necesita Chrome 80', n);
    if (n.type === 'AssignmentExpression' && ['||=', '&&=', '??='].includes(n.operator)) marca(`${n.operator} necesita Chrome 85`, n);
    if (n.type === 'Literal' && typeof n.raw === 'string' && /^\d[\d_]*_\d/.test(n.raw)) marca('separador _ en números necesita Chrome 75', n);
    if (['PropertyDefinition', 'PrivateIdentifier', 'StaticBlock'].includes(n.type)) marca('campos de clase necesitan Chrome 72+', n);
    if (n.type === 'Identifier' && n.name === 'structuredClone') marca('structuredClone necesita Chrome 98', n);
    if (n.type === 'MemberExpression' && !n.computed && Object.prototype.hasOwnProperty.call(API_NUEVAS, n.property.name) && n.property.name !== 'any')
      marca(`.${n.property.name} necesita Chrome ${API_NUEVAS[n.property.name]}`, n);
  });
  return lista;
}

test('el código de la app corre en el Chrome de fábrica de las tablets (Chrome 74)', () => {
  const todos = app.flatMap(problemas);
  assert.deepEqual(todos, [], `\n${todos.join('\n')}`);
});

test('si el arranque falla, index.html muestra qué pasa en vez de quedarse en «Cargando…»', () => {
  const html = readFileSync('index.html', 'utf8');
  assert.match(html, /id="arranque-fallido"/, 'falta el aviso de arranque fallido');
  assert.ok(html.includes('/Chrome\\/(\\d+)/'), 'el aviso debe mostrar la versión de Chrome');
  assert.match(html, /window\.__cronocartasListo/, 'el aviso debe saber si la app arrancó');
  assert.match(readFileSync('js/ui/app.js', 'utf8'), /window\.__cronocartasListo = true/);
});
