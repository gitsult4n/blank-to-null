// TypeScript reads a bare .d.ts as CommonJS in a package without "type": "module",
// so the ESM entry needs its own .d.mts to match index.mjs.
import type { AnyInput, BlankToNullOptions, IsBlankOptions, Blanked, Pruned } from './types.js';

export type { BlankToNullOptions, IsBlankOptions, Blanked, Pruned };

/**
 * True for `null`, `undefined`, a blank string, an empty array and an empty
 * plain object. Everything else, including `0`, `false` and `new Date()`, is
 * not blank.
 *
 * @param value - Value to test.
 * @param options - `{ trim }` decides whether a whitespace-only string counts
 * as blank. Default: `true`.
 *
 * @example
 * ```ts
 * isBlank('   ');                    // true
 * isBlank('   ', { trim: false });   // false
 * isBlank(0);                        // false
 * isBlank({});                       // true
 * ```
 */
export declare function isBlank(value: unknown, options?: IsBlankOptions): boolean;

/**
 * Returns a copy where blank strings and `undefined` become `null`.
 *
 * Plain objects and arrays are copied; every other object (`Date`, `Map`, class
 * instances, functions) passes through by reference. Array holes are
 * materialized as `null`; extra properties set on an array are not copied.
 *
 * The return type follows the options actually passed at the call site, so
 * `{ trim: false }` keeps whitespace-only strings and `{ undefinedToNull: false }`
 * keeps `undefined`. An option typed as a wide `boolean` widens the result to
 * the union of both outcomes instead of guessing one.
 *
 * @param input - Value to convert. Never mutated.
 * @param options - See {@link BlankToNullOptions}. Defaults: `trim: true`,
 * `deep: true`, `undefinedToNull: true`, `emptyArrayToNull: false`,
 * `emptyObjectToNull: false`.
 *
 * @example
 * ```ts
 * blankToNull({ name: '  Ada  ', bio: '   ', age: 0 });
 * // { name: 'Ada', bio: null, age: 0 }
 * // typed { name: string | null; bio: string | null; age: number }
 *
 * blankToNull('  ', { trim: false });               // '  '   typed '  '
 * blankToNull(undefined, { undefinedToNull: false }); // undefined
 * blankToNull({ tags: [] }, { emptyArrayToNull: true }); // { tags: null }
 * ```
 *
 * @example Shallow mode leaves nested containers untouched, by reference.
 * ```ts
 * blankToNull({ bio: '  ', meta: { note: '  ' } }, { deep: false });
 * // { bio: null, meta: { note: '  ' } }
 * ```
 */
export declare function blankToNull<T extends AnyInput, O extends BlankToNullOptions = {}>(
  input: T,
  options?: O,
): Blanked<T, O>;

/**
 * Returns a copy of plain objects with `null` and `undefined` keys removed.
 * Array positions are preserved, so array entries are never dropped.
 *
 * In the result type a key that can hold `null`/`undefined` becomes optional, a
 * key that always holds one of them disappears, and a key that can hold neither
 * stays required.
 *
 * @param input - Value to prune. Never mutated.
 *
 * @example
 * ```ts
 * pruneNull({ a: 1, b: null, c: undefined, d: { e: null, f: 2 } });
 * // { a: 1, d: { f: 2 } }
 *
 * pruneNull([1, null, 2]);   // [1, null, 2]  positions are kept
 * ```
 *
 * @example The payload cleanup path.
 * ```ts
 * pruneNull(blankToNull({ name: ' Ada ', bio: '   ' }));
 * // { name: 'Ada' }
 * ```
 */
export declare function pruneNull<T extends AnyInput>(input: T): Pruned<T>;

export default blankToNull;
