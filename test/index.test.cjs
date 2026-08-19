const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const blankToNull = require('../src/index.js');
const { isBlank, pruneNull } = require('../src/index.js');

test('require returns the default function', () => {
  assert.equal(typeof blankToNull, 'function');
  assert.equal(blankToNull.default, blankToNull);
  assert.equal(blankToNull.blankToNull, blankToNull);
});

test('named exports are reachable from require', () => {
  assert.equal(isBlank('   '), true);
  assert.equal(isBlank(0), false);
  assert.deepEqual(pruneNull({ a: 1, b: null }), { a: 1 });
});

test('conversion behaves as it does under ESM', () => {
  assert.deepEqual(blankToNull({ Name: '  Ada ', Bio: '   ', Age: 0 }), {
    Name: 'Ada',
    Bio: null,
    Age: 0,
  });
});

// A .cjs file on the resolution path breaks bundlers whose catch-all asset rule
// whitelists only .js/.mjs: create-react-app 5 turns the imported module into a
// URL string, so the default export silently stops being a function while the
// build still succeeds. Every reachable runtime entry must stay .js or .mjs.
test('no reachable runtime entry is a .cjs file', () => {
  const pkg = require('../package.json');
  const entry = pkg.exports['.'];

  for (const target of [pkg.main, entry.import.default, entry.require.default]) {
    assert.ok(!target.endsWith('.cjs'), `${target} must not be a .cjs file`);
  }

  const esm = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.mjs'), 'utf8');
  assert.ok(!/\.cjs['"]/.test(esm), 'src/index.mjs must not import a .cjs file');
});
