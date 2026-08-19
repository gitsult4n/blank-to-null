# blank-to-null

[![npm](https://img.shields.io/npm/v/blank-to-null.svg)](https://www.npmjs.com/package/blank-to-null)
[![downloads](https://img.shields.io/npm/dm/blank-to-null.svg)](https://www.npmjs.com/package/blank-to-null)
[![CI](https://github.com/gitsult4n/blank-to-null/actions/workflows/ci.yml/badge.svg)](https://github.com/gitsult4n/blank-to-null/actions/workflows/ci.yml)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://github.com/gitsult4n/blank-to-null/blob/main/package.json)
[![types](https://img.shields.io/badge/types-included-blue.svg)](https://github.com/gitsult4n/blank-to-null/blob/main/src/types.d.ts)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/gitsult4n/blank-to-null/blob/main/LICENSE)

Turn blank and `undefined` values into `null`, deeply, with zero dependencies.

```js
import blankToNull from 'blank-to-null';

blankToNull({ name: '  Ada ', bio: '   ', age: 0, tags: ['', 'js'] });
// { name: 'Ada', bio: null, age: 0, tags: [null, 'js'] }
```

---

## Table of contents

- [The problem](#the-problem)
- [Install](#install)
- [Quick start](#quick-start)
- [API](#api)
  - [`blankToNull(input, options?)`](#blanktonullinput-options)
  - [`isBlank(value, options?)`](#isblankvalue-options)
  - [`pruneNull(input)`](#prunenullinput)
- [Options](#options)
- [Recipes](#recipes)
- [TypeScript](#typescript)
- [Behavior reference](#behavior-reference)
- [Limits](#limits)
- [Why not `||` or `??`](#why-not--or-)
- [Contributing](#contributing)
- [License](#license)

---

## The problem

An HTML form never sends `null`. An untouched text input submits `""`, and a field the
user cleared submits `""` too. Databases and APIs want `null` for "not provided", so every
project ends up writing the same recursive walk to bridge the two.

The usual one-liner is wrong:

```js
const bio = form.bio || null;   // also turns 0 and false into null
const bio = form.bio ?? null;   // leaves '' and '   ' untouched
```

`blankToNull` does the whole walk in one call, keeps `0`/`false`/`NaN` intact, trims as it
goes, and never mutates the input.

## Install

```bash
npm install blank-to-null
```

Node **18+**. Zero runtime dependencies. Ships ESM, CommonJS, and TypeScript declarations
for both.

## Quick start

**ESM**

```js
import blankToNull, { isBlank, pruneNull } from 'blank-to-null';
```

**CommonJS**

```js
const blankToNull = require('blank-to-null');
const { isBlank, pruneNull } = require('blank-to-null');
```

**TypeScript** — no `@types` package needed, and no cast at the call site:

```ts
import blankToNull from 'blank-to-null';

const dto = blankToNull({ name: '  Ada  ', age: 0 });
//    ^? { name: string | null; age: number }
```

Then:

```js
blankToNull('   ');                       // null
blankToNull('  Ada  ');                   // 'Ada'
blankToNull({ a: '', b: 0, c: false });   // { a: null, b: 0, c: false }
blankToNull([ '', 'js' ]);                // [null, 'js']
blankToNull(undefined);                   // null
blankToNull(new Date('2020-01-01'));      // same Date, by reference
```

## API

Three functions. Two of them take options; none of them mutate anything.

### `blankToNull(input, options?)`

Returns a **copy** of `input` where blank strings and `undefined` become `null`.
Strings are trimmed. Plain objects and arrays are rebuilt; every other object passes
through by reference.

```js
blankToNull({ name: '  Ada  ', bio: '   ', meta: { note: '  ' } });
// { name: 'Ada', bio: null, meta: { note: null } }
```

Available as both a default and a named export:

```js
import blankToNull from 'blank-to-null';
import { blankToNull } from 'blank-to-null';   // same function
```

### `isBlank(value, options?)`

`true` for `null`, `undefined`, a blank string, `[]` and `{}`. Everything else — including
`0`, `false` and `NaN` — is **not** blank.

```js
isBlank(null);                  // true
isBlank(undefined);             // true
isBlank('');                    // true
isBlank('   ');                 // true
isBlank('   ', { trim: false }); // false
isBlank([]);                    // true
isBlank({});                    // true

isBlank(0);                     // false
isBlank(false);                 // false
isBlank(NaN);                   // false
isBlank(new Date());            // false
isBlank(new Map());             // false — not a plain object
```

Only `trim` is read; the other options do not apply.

### `pruneNull(input)`

Drops `null` and `undefined` **object keys**, so a `PATCH` body carries only what changed.
Array positions are preserved — dropping them would shift every later index.

```js
pruneNull({ a: 1, b: null, c: undefined });  // { a: 1 }
pruneNull({ a: { b: null, c: 2 } });         // { a: { c: 2 } }
pruneNull([1, null, 2]);                     // [1, null, 2]
```

It takes no options. Pair it with `blankToNull` when you want blanks gone rather than
nulled:

```js
pruneNull(blankToNull({ name: ' Ada ', bio: '   ' }));
// { name: 'Ada' }
```

## Options

| Option | Default | Effect |
| --- | --- | --- |
| `trim` | `true` | Trim strings before the emptiness test, and in the output |
| `deep` | `true` | Walk nested plain objects and arrays. `false` converts the top level only |
| `undefinedToNull` | `true` | Convert `undefined` to `null` |
| `emptyArrayToNull` | `false` | Convert `[]` to `null` |
| `emptyObjectToNull` | `false` | Convert `{}` to `null` |

Every option is optional, and so is the options object itself. Passing `undefined` — or
`null` — for either keeps the defaults, so `{ trim: cfg.trim }` on an absent config is not
an accidental opt-out:

```js
blankToNull(form);                    // defaults
blankToNull(form, undefined);         // defaults
blankToNull(form, null);              // defaults
blankToNull(form, { trim: undefined }); // trim stays true
```

Each option in practice:

```js
// trim — off means whitespace is content
blankToNull('  ');                       // null
blankToNull('  ', { trim: false });      // '  '
blankToNull(' a ', { trim: false });     // ' a '

// deep — off leaves nested containers alone, by reference
blankToNull({ bio: '  ', meta: { note: '  ' } }, { deep: false });
// { bio: null, meta: { note: '  ' } }

// undefinedToNull — off keeps undefined distinct from null
blankToNull({ a: undefined });                            // { a: null }
blankToNull({ a: undefined }, { undefinedToNull: false }); // { a: undefined }

// emptyArrayToNull / emptyObjectToNull — collapse empty containers
blankToNull({ tags: [] }, { emptyArrayToNull: true });     // { tags: null }
blankToNull({ meta: {} }, { emptyObjectToNull: true });    // { meta: null }
```

Collapsing happens **after** the walk, so a container that becomes empty only because its
contents were blank collapses too:

```js
blankToNull({ tags: ['', '  '] }, { emptyArrayToNull: true });
// { tags: [null, null] }   — the array is not empty, it holds two nulls
```

## Recipes

**Normalize a form before sending**

```js
const payload = blankToNull(Object.fromEntries(new FormData(formEl)));
await fetch('/api/users', { method: 'POST', body: JSON.stringify(payload) });
```

**PATCH only what changed**

```js
await api.patch(`/users/${id}`, pruneNull(blankToNull(form)));
```

**Express / Fastify — normalize every incoming body**

```js
app.use((req, _res, next) => {
  if (req.body) req.body = blankToNull(req.body);
  next();
});
```

**NestJS interceptor**

```ts
@Injectable()
export class BlankToNullInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    if (req.body) req.body = blankToNull(req.body);
    return next.handle();
  }
}
```

**Guard a required field**

```js
if (isBlank(form.email)) throw new Error('email is required');
```

**Keep `undefined` meaningful** — some ORMs treat `undefined` as "leave alone" and `null`
as "set to NULL":

```js
const update = blankToNull(form, { undefinedToNull: false });
```

## TypeScript

Declarations ship with the package — separate files for the ESM and CommonJS entry points,
so `import` and `require` both resolve correctly under `node16`, `nodenext`, `bundler` and
legacy `node10`. Verified by [`attw`](https://github.com/arethetypeswrong/arethetypeswrong.github.io)
in CI. **TypeScript 4.9 and newer.**

Exported types:

```ts
import type {
  Blanked,           // Blanked<T, Options>  — result of blankToNull
  Pruned,            // Pruned<T>            — result of pruneNull
  BlankToNullOptions,
  IsBlankOptions,
} from 'blank-to-null';
```

### `null` only where a value can actually be blank

The return type is computed from the input type, so a value that can never be blank never
gains `| null`:

```ts
type A = Blanked<string>;   // string | null   — could be ''
type B = Blanked<'ada'>;    // 'ada'           — never blank, never null
type C = Blanked<''>;       // null            — always blank
type D = Blanked<number>;   // number          — numbers are never blank
type E = Blanked<Date>;     // Date            — passes by reference
```

Trimming is modeled too, so the type matches what the runtime actually returns:

```ts
type F = Blanked<' a '>;                   // 'a'    — the runtime trims it
type G = Blanked<'  '>;                    // null   — trims to '', so blank
type H = Blanked<'  ', { trim: false }>;   // '  '   — trim off, so it survives
```

### The options you pass change the type

The options object is read at the call site, not assumed:

```ts
blankToNull(undefined);                             // null
blankToNull(undefined, { undefinedToNull: false }); // undefined

blankToNull({ tags: [] }, { emptyArrayToNull: true });
// { tags: null }

blankToNull({ a: '  ', b: { c: '  ' } }, { deep: false });
// { a: string | null; b: { c: string } }
```

An option whose type is a wide `boolean` — a runtime flag, not a literal — widens the
result to the union of both outcomes rather than guessing one:

```ts
declare const flag: boolean;
blankToNull('  ', { trim: flag });   // '  ' | null
```

To keep the narrow type, use a literal or `as const`:

```ts
const opts = { trim: false } as const;
blankToNull('  ', opts);             // '  '
```

### `Pruned<T>`

A key that *can* be `null`/`undefined` becomes optional, a key that is *always* one of them
disappears, and a key that can be neither stays required:

```ts
type P1 = Pruned<{ a: number; b: string | null }>;  // { a: number; b?: string }
type P2 = Pruned<{ a: null }>;                      // {}
type P3 = Pruned<{ a: number }>;                    // { a: number }
type P4 = Pruned<(number | null)[]>;                // (number | null)[]  — arrays keep positions
```

### Structures the types handle

Tuples (including optional, rest and named elements), `readonly` arrays and properties,
index signatures, `symbol` keys, unions, enums, template-literal string types, class
instances, and recursive or mutually recursive interfaces all round-trip correctly. The
package is covered by 159 type assertions run against **both** module formats, on every
supported TypeScript version, in CI.

## Behavior reference

- **Nothing is mutated.** Objects and arrays are rebuilt; the input is untouched.
- **Only plain objects and arrays are walked.** `Date`, `Map`, `Set`, `RegExp`, `Promise`,
  functions, class instances and boxed primitives pass through **by reference**, unchanged.
- **Falsy values survive.** `0`, `false`, `NaN` and `0n` are data, not blanks.
- **Circular references are safe.** A cycle is preserved in the copy, not re-walked.
- **`__proto__` stays data.** A parsed body like `{"__proto__": {...}}` keeps that key as an
  own property; the copy's prototype is never rewritten, and the key is never dropped.
- **Null-prototype objects** (`Object.create(null)`) count as plain objects, and the copy
  keeps the null prototype.
- **Enumerable symbol keys are copied.** Non-enumerable properties, and extra properties
  hung off an array, are not.
- **Getters are read once** and copied as plain data — the copy has a value, not an accessor.
- **Array holes become `null`**, since a hole reads as `undefined` and is converted like any
  other value.
- **Key order follows JavaScript's own rule**: integer-like keys come first, in ascending
  order, then string keys in insertion order, then symbols.
- **`pruneNull` is a single pass.** An object that loses all of its keys is left as `{}`, not
  removed from its parent.

## Limits

- **Depth.** The walk is recursive, so a pathological structure can exhaust the stack.
  `blankToNull` handles a few thousand levels of nesting — around **3000-4000**, varying
  with the available stack — and throws `RangeError` beyond that. `JSON.parse` in V8 is
  iterative and has no comparable limit, so a hostile body can parse and still fail to
  convert. The error is catchable: wrap the call, or cap request depth, if you accept
  untrusted deeply-nested JSON.
- **Wide `boolean` options** widen the result type to a union — see
  [TypeScript](#the-options-you-pass-change-the-type).
- **`Blanked` reflects the *input type*, not the literal you wrote.** TypeScript widens
  object-literal properties, so `blankToNull({ a: '' })` types `a` as `string | null`, not
  `null`. Add `as const` if you want literal precision.

## Why not `||` or `??`

```js
const bio = form.bio || null;   // 0 and false become null too
const bio = form.bio ?? null;   // '' and '   ' pass straight through
```

Neither trims, neither recurses, and both have to be repeated for every field.

## Contributing

```bash
npm install
npm test           # runtime tests (node --test)
npm run test:types # type assertions, ESM + CJS, via tsc
npm run test:package # package resolution check (attw)
npm run test:all   # all three
```

The runtime lives in `src/index.js` (CommonJS) and `src/index.mjs` is a thin ESM
wrapper. No file in the package uses the `.cjs` extension, deliberately:
create-react-app 5 routes any imported `.cjs` through its catch-all asset rule and
hands back a URL string instead of the module, so the default export stops being a
function while the build still succeeds. Type declarations are `src/types.d.ts`
(shared) plus `src/index.d.mts` and `src/index.d.ts` (entry points). Type assertions
live in `test-d/assert.mts`; the CommonJS variant is generated from it by
`test-d/gen-cts.mjs`, so the two can never drift — **edit the `.mts` file only.**

Issues and pull requests: <https://github.com/gitsult4n/blank-to-null>

## License

MIT © [gitsult4n](https://github.com/gitsult4n)
