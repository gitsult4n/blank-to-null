# blank-to-null

[![CI](https://github.com/gitsult4n/blank-to-null/actions/workflows/ci.yml/badge.svg)](https://github.com/gitsult4n/blank-to-null/actions/workflows/ci.yml)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://github.com/gitsult4n/blank-to-null/blob/main/package.json)
[![types](https://img.shields.io/badge/types-included-blue.svg)](https://github.com/gitsult4n/blank-to-null/blob/main/src/index.d.ts)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/gitsult4n/blank-to-null/blob/main/LICENSE)

Turn blank and `undefined` values into `null`, deeply, with zero dependencies.

HTML inputs never produce `null` — an untouched text field submits `""`. Most APIs and
databases want `null` for "not provided". Every project ends up rewriting the same
recursive walk to bridge the two, usually with `value || null`, which also swallows
`0` and `false`.

```js
import blankToNull, { isBlank, pruneNull } from 'blank-to-null';

blankToNull({ Name: '  Ada ', Bio: '   ', Age: 0, Tags: ['', 'js'] });
// { Name: 'Ada', Bio: null, Age: 0, Tags: [null, 'js'] }
```

## Install

```bash
npm install blank-to-null
```

Node 18+. ESM. No dependencies.

## API

### `blankToNull(input, options?)`

Returns a **copy** where blank strings and `undefined` become `null`. Strings are trimmed.

| Option | Default | Effect |
| --- | --- | --- |
| `trim` | `true` | Trim strings before the emptiness test, and in the output |
| `deep` | `true` | Walk nested plain objects and arrays. `false` converts the top level only |
| `undefinedToNull` | `true` | Convert `undefined` to `null` |
| `emptyArrayToNull` | `false` | Convert `[]` to `null` |
| `emptyObjectToNull` | `false` | Convert `{}` to `null` |

Passing `undefined` for an option keeps its default, so `{ trim: cfg.trim }` on an absent
config is not an accidental opt-out.

```js
blankToNull('   ');                          // null
blankToNull('  Bio  ');                      // 'Bio'
blankToNull('  ', { trim: false });          // '  '
blankToNull(undefined);                      // null
blankToNull({ tags: [] }, { emptyArrayToNull: true }); // { tags: null }

// deep: false copies the top level, leaves nested containers by reference
blankToNull({ Bio: '  ', meta: { Note: '  ' } }, { deep: false });
// { Bio: null, meta: { Note: '  ' } }
```

### `isBlank(value, options?)`

`true` for `null`, `undefined`, a blank string, `[]` and `{}`. Everything else — including
`0`, `false` and `NaN` — is not blank.

```js
isBlank('   ');   // true
isBlank(0);       // false
isBlank(new Date()); // false
```

### `pruneNull(input)`

Drops `null` and `undefined` **object keys** so `PATCH` bodies only carry what changed.
Array positions are preserved, because dropping them would shift every later index.

```js
pruneNull({ a: 1, b: null, c: undefined }); // { a: 1 }
pruneNull([1, null, 2]);                    // [1, null, 2]
```

## Behavior worth knowing

- **Nothing is mutated.** Objects and arrays are rebuilt; the input is untouched.
- **Only plain objects and arrays are walked.** `Date`, `Map`, `Set`, `RegExp`, class
  instances and everything else pass through by reference, unchanged.
- **Falsy values survive.** `0`, `false` and `NaN` are data, not blanks. This is the whole
  reason not to write `value || null`.
- **Circular references are safe.** Cycles are preserved in the copy, not re-walked.
- **`__proto__` stays data.** A parsed body like `{"__proto__": {...}}` keeps that key as an
  own property; the copy's prototype is never rewritten, and the key is never dropped.
- **Null-prototype objects** (`Object.create(null)`) count as plain objects, and the copy
  keeps the null prototype.
- **Enumerable symbol keys are copied.** Non-enumerable properties, and extra properties
  hung off an array, are not.
- **Array holes become `null`**, since `undefined` is converted like any other value.

## TypeScript

Return types are mapped, so nothing needs a cast:

```ts
const dto = blankToNull({ Name: '  Ada  ', Age: 0 });
// { Name: string | null; Age: number }
```

## Why not just `??` or `||`

```js
const bio = Bio || null;   // turns 0 and false into null too
const bio = Bio ?? null;   // leaves '' and '   ' alone
```

Neither trims, neither recurses, and both have to be repeated for every field.

## Typical use

```js
// client: normalize before sending
await api.patch(`/users/${id}`, pruneNull(blankToNull(form)));

// server: normalize what arrived
const dto = blankToNull(req.body);
```

## License

MIT © [gitsult4n](https://github.com/gitsult4n)
