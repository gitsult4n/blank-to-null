import test from 'node:test';
import assert from 'node:assert/strict';
import blankToNull, { isBlank, pruneNull } from '../src/index.mjs';

test('blank strings become null', () => {
  assert.equal(blankToNull(''), null);
  assert.equal(blankToNull('   '), null);
  assert.equal(blankToNull('\n\t '), null);
});

test('non-blank strings are trimmed', () => {
  assert.equal(blankToNull('  Bio  '), 'Bio');
});

test('trim can be disabled', () => {
  assert.equal(blankToNull('  ', { trim: false }), '  ');
  assert.equal(blankToNull('  Bio  ', { trim: false }), '  Bio  ');
});

test('undefined becomes null unless disabled', () => {
  assert.equal(blankToNull(undefined), null);
  assert.equal(blankToNull(undefined, { undefinedToNull: false }), undefined);
});

test('falsy non-strings survive', () => {
  assert.equal(blankToNull(0), 0);
  assert.equal(blankToNull(false), false);
  assert.ok(Number.isNaN(blankToNull(NaN)));
});

test('objects are walked deeply', () => {
  const input = { Name: ' Ada ', Bio: '   ', Meta: { Note: '', Count: 0 } };
  assert.deepEqual(blankToNull(input), {
    Name: 'Ada',
    Bio: null,
    Meta: { Note: null, Count: 0 },
  });
});

test('input is not mutated', () => {
  const input = { Bio: '  ' };
  blankToNull(input);
  assert.equal(input.Bio, '  ');
});

test('arrays keep their length', () => {
  assert.deepEqual(blankToNull(['a', '', ' b ']), ['a', null, 'b']);
});

test('deep can be disabled', () => {
  const nested = { Note: '  ' };
  const input = { Bio: '  ', nested };
  const out = blankToNull(input, { deep: false });
  assert.notEqual(out, input);
  assert.equal(out.Bio, null);
  assert.equal(out.nested, nested);
  assert.equal(nested.Note, '  ');
});

test('deep:false still honors empty collapsing at the top level', () => {
  assert.equal(blankToNull([], { deep: false, emptyArrayToNull: true }), null);
  assert.equal(blankToNull({}, { deep: false, emptyObjectToNull: true }), null);
});

test('empty array and object conversion is opt-in', () => {
  assert.deepEqual(blankToNull([]), []);
  assert.deepEqual(blankToNull({}), {});
  assert.equal(blankToNull([], { emptyArrayToNull: true }), null);
  assert.equal(blankToNull({}, { emptyObjectToNull: true }), null);
});

test('nested empties collapse when opted in', () => {
  const out = blankToNull({ tags: [] }, { emptyArrayToNull: true });
  assert.deepEqual(out, { tags: null });
});

test('exotic objects pass through by reference', () => {
  const date = new Date(0);
  const map = new Map([['a', '']]);
  const re = /x/g;
  class User {}
  const user = new User();
  const out = blankToNull({ date, map, re, user });
  assert.equal(out.date, date);
  assert.equal(out.map, map);
  assert.equal(out.re, re);
  assert.equal(out.user, user);
});

test('circular references terminate', () => {
  const input = { Bio: '  ' };
  input.self = input;
  const out = blankToNull(input);
  assert.equal(out.Bio, null);
  assert.equal(out.self, out);
});

test('null-prototype objects are treated as plain and stay null-prototype', () => {
  const input = Object.create(null);
  input.Bio = '  ';
  const out = blankToNull(input);
  assert.equal(out.Bio, null);
  assert.equal(Object.getPrototypeOf(out), null);
});

test('an own __proto__ key stays an own data property', () => {
  const input = JSON.parse('{"__proto__":{"admin":true},"Name":"  Ada  "}');
  const out = blankToNull(input);
  assert.equal(Object.getPrototypeOf(out), Object.prototype);
  assert.equal(Object.hasOwn(out, '__proto__'), true);
  assert.equal(out.admin, undefined);
  assert.equal(out.Name, 'Ada');
  assert.deepEqual(out.__proto__, { admin: true });
});

test('pruneNull keeps an own __proto__ key out of the prototype chain', () => {
  const out = pruneNull(JSON.parse('{"__proto__":{"admin":true},"k":1}'));
  assert.equal(Object.getPrototypeOf(out), Object.prototype);
  assert.equal(Object.hasOwn(out, '__proto__'), true);
  assert.equal(out.admin, undefined);
});

test('a shared empty container collapses consistently', () => {
  const shared = [];
  assert.deepEqual(blankToNull({ a: shared, b: shared }, { emptyArrayToNull: true }), {
    a: null,
    b: null,
  });
  const inner = {};
  assert.deepEqual(blankToNull({ a: inner, b: inner }, { emptyObjectToNull: true }), {
    a: null,
    b: null,
  });
});

test('explicitly undefined options fall back to the defaults', () => {
  const cfg = {};
  assert.equal(blankToNull('  ', { trim: cfg.trim }), null);
  assert.equal(blankToNull(undefined, { undefinedToNull: cfg.undefinedToNull }), null);
  assert.deepEqual(blankToNull({ Bio: '  ' }, { deep: cfg.deep }), { Bio: null });
  assert.equal(isBlank('  ', { trim: cfg.trim }), true);
});

test('enumerable symbol keys are copied', () => {
  const key = Symbol('tag');
  const out = blankToNull({ [key]: '  x  ', Bio: '  ' });
  assert.equal(out[key], 'x');
  assert.equal(out.Bio, null);
  assert.equal(isBlank({ [key]: 1 }), false);
});

test('array holes become null', () => {
  assert.deepEqual(blankToNull([, 1]), [null, 1]);
});

test('isBlank covers the empty cases', () => {
  for (const value of [null, undefined, '', '  ', [], {}]) {
    assert.equal(isBlank(value), true, `expected blank: ${JSON.stringify(value)}`);
  }
  for (const value of [0, false, 'a', [0], { a: 1 }, new Date(0)]) {
    assert.equal(isBlank(value), false, `expected non-blank: ${JSON.stringify(value)}`);
  }
  assert.equal(isBlank('  ', { trim: false }), false);
});

test('pruneNull drops null and undefined object keys', () => {
  const out = pruneNull({ a: 1, b: null, c: undefined, d: { e: null, f: 2 } });
  assert.deepEqual(out, { a: 1, d: { f: 2 } });
  assert.equal('b' in out, false);
  assert.equal('c' in out, false);
});

test('pruneNull preserves array positions', () => {
  assert.deepEqual(pruneNull([1, null, 2]), [1, null, 2]);
});

test('pruneNull handles circular references', () => {
  const input = { a: 1 };
  input.self = input;
  const out = pruneNull(input);
  assert.equal(out.self, out);
});

test('blankToNull then pruneNull is the payload cleanup path', () => {
  const form = { Name: ' Ada ', Bio: '   ', Age: 0, Tags: ['', 'x'] };
  assert.deepEqual(pruneNull(blankToNull(form)), {
    Name: 'Ada',
    Age: 0,
    Tags: [null, 'x'],
  });
});
