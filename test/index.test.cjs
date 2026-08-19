const test = require('node:test');
const assert = require('node:assert/strict');
const blankToNull = require('../src/index.cjs');
const { isBlank, pruneNull } = require('../src/index.cjs');

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
