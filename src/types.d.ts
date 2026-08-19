// Shared type definitions for both entry points. Only the four public aliases
// (BlankToNullOptions, IsBlankOptions, Blanked, Pruned) are re-exported from
// index.d.mts / index.d.cts; everything else here is internal and unreachable
// for consumers because "exports" exposes no deep paths.

/** Options accepted by `blankToNull`. */
export interface BlankToNullOptions {
  /** Trim strings before testing for emptiness. Default: `true` */
  trim?: boolean;
  /** Walk nested plain objects and arrays. When false, only the top level is converted. Default: `true` */
  deep?: boolean;
  /** Convert `undefined` to `null`. Default: `true` */
  undefinedToNull?: boolean;
  /** Convert `[]` to `null`. Default: `false` */
  emptyArrayToNull?: boolean;
  /** Convert `{}` to `null`. Default: `false` */
  emptyObjectToNull?: boolean;
}

/** Options accepted by `isBlank`. */
export interface IsBlankOptions {
  /** Trim strings before testing for emptiness. Default: `true` */
  trim?: boolean;
}

/**
 * Constraint for the input of `blankToNull`. Accepts exactly what `unknown`
 * accepts, but because it mentions primitives TypeScript keeps literal types
 * during inference, so `blankToNull('  Ada  ')` is typed `'Ada'` instead of
 * `string | null`. Requires TypeScript >= 4.8, where `unknown` became
 * assignable to `{} | null | undefined`.
 *
 * @internal
 */
export type AnyInput = {} | null | undefined;

/* -------------------------------------------------------------------------- */
/* option resolution                                                          */
/* -------------------------------------------------------------------------- */

type IsAny<T> = 0 extends 1 & T ? true : false;

type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;

/**
 * Sound three-way choice on a boolean flag: a literal picks its branch, the wide
 * `boolean` yields the union of both outcomes because the runtime could take
 * either path.
 */
type Branch<Flag extends boolean, OnTrue, OnFalse> = [Flag] extends [true]
  ? OnTrue
  : [Flag] extends [false]
    ? OnFalse
    : OnTrue | OnFalse;

type Read<O, K extends keyof BlankToNullOptions> = K extends keyof O ? O[K] : undefined;

// `options.x ?? DEFAULTS.x`: a missing key and an explicit `undefined` both take
// the default, so the resolved flag is the option's non-undefined part plus the
// default whenever `undefined` is still possible.
type Flag<O, K extends keyof BlankToNullOptions, Default extends boolean> = IsAny<O> extends true
  ? boolean
  : Extract<Read<O, K>, boolean> | (undefined extends Read<O, K> ? Default : never);

interface ResolvedOptions {
  trim: boolean;
  deep: boolean;
  undefinedToNull: boolean;
  emptyArrayToNull: boolean;
  emptyObjectToNull: boolean;
}

type Resolve<O extends BlankToNullOptions> = {
  trim: Flag<O, 'trim', true>;
  deep: Flag<O, 'deep', true>;
  undefinedToNull: Flag<O, 'undefinedToNull', true>;
  emptyArrayToNull: Flag<O, 'emptyArrayToNull', false>;
  emptyObjectToNull: Flag<O, 'emptyObjectToNull', false>;
};

/* -------------------------------------------------------------------------- */
/* strings                                                                    */
/* -------------------------------------------------------------------------- */

// The set String.prototype.trim() strips: WhiteSpace plus LineTerminator.
type Whitespace =
  | ' '
  | '\t'
  | '\n'
  | '\r'
  | '\f'
  | '\v'
  | '\u00a0'
  | '\u1680'
  | '\u2000'
  | '\u2001'
  | '\u2002'
  | '\u2003'
  | '\u2004'
  | '\u2005'
  | '\u2006'
  | '\u2007'
  | '\u2008'
  | '\u2009'
  | '\u200a'
  | '\u2028'
  | '\u2029'
  | '\u202f'
  | '\u205f'
  | '\u3000'
  | '\ufeff';

// Recursion is bounded by the number of edge whitespace characters, never by the
// length of the string, and a non-literal type stops on the first check.
type TrimLeft<S extends string> = S extends `${Whitespace}${infer Rest}` ? TrimLeft<Rest> : S;
type TrimRight<S extends string> = S extends `${infer Rest}${Whitespace}` ? TrimRight<Rest> : S;
type TrimString<S extends string> = TrimRight<TrimLeft<S>>;

// `s === '' ? null : s` at the type level: `''` alone becomes `null`, a type that
// merely contains `''` (`string`, a template literal) keeps its non-empty part
// and gains `null`.
type NullWhenEmpty<S extends string> = [S] extends ['']
  ? null
  : '' extends S
    ? Exclude<S, ''> | null
    : S;

type BlankedString<S extends string, DoTrim extends boolean> = string extends S
  ? string | null
  : Branch<DoTrim, NullWhenEmpty<TrimString<S>>, NullWhenEmpty<S>>;

/* -------------------------------------------------------------------------- */
/* containers                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Objects that are values to the caller, not containers to walk into: everything
 * the runtime rejects with `!Array.isArray(value) && !isPlainObject(value)`.
 */
type Opaque =
  | Date
  | RegExp
  | Error
  | Map<unknown, unknown>
  | ReadonlyMap<unknown, unknown>
  | Set<unknown>
  | ReadonlySet<unknown>
  | WeakMap<object, unknown>
  | WeakSet<object>
  | Promise<unknown>
  | ArrayBuffer
  | DataView
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | ((...args: never[]) => unknown)
  | (abstract new (...args: never[]) => unknown);

type Primitive = number | bigint | boolean | symbol;

// A new array is built and every position is filled, so tuple shape, optional
// elements and rest elements all survive; the copy is always mutable.
type WalkArray<T extends readonly unknown[], R extends ResolvedOptions> = {
  -readonly [K in keyof T]: Convert<T[K], R, true>;
};

// Uninhabited element type means length 0 is the only possibility.
type AlwaysEmptyArray<T extends readonly unknown[]> = [T[number]] extends [never] ? true : false;

// One required position is enough to rule out `length === 0`, including tuples
// with a rest tail, whose `['length']` is the useless `number`.
type NeverEmptyArray<T extends readonly unknown[]> = [T] extends [readonly [unknown, ...unknown[]]]
  ? true
  : false;

/**
 * Flattens an intersection into one object literal so tooltips stay readable and
 * so a walked object compares equal to the plain object type it describes.
 */
type Prettify<T> = { [K in keyof T]: T[K] } & {};

type WalkObject<T, R extends ResolvedOptions> = Prettify<{
  -readonly [K in keyof T]: Convert<T[K], R, true>;
}>;

type AlwaysEmptyObject<T> = [keyof T] extends [never] ? true : false;

// A value with no properties is assignable exactly when nothing is required, so
// index signatures and all-optional objects correctly count as maybe-empty.
type MaybeEmptyObject<T> = {} extends T ? true : false;

// `emptyArrayToNull && out.length === 0` / `emptyObjectToNull && no keys`.
// The collapse replaces the copy only when the container is provably empty;
// otherwise `null` joins the union, and never appears when the container is
// provably non-empty.
type Collapse<Flag extends boolean, Always extends boolean, Maybe extends boolean, Walked> = [
  Flag,
] extends [false]
  ? Walked
  : [Maybe] extends [false]
    ? Walked
    : [Always] extends [true]
      ? Branch<Flag, null, Walked>
      : Walked | null;

type ConvertArray<T extends readonly unknown[], R extends ResolvedOptions> = Collapse<
  R['emptyArrayToNull'],
  AlwaysEmptyArray<T>,
  NeverEmptyArray<T> extends true ? false : true,
  WalkArray<T, R>
>;

type ConvertObject<T, R extends ResolvedOptions> = Collapse<
  R['emptyObjectToNull'],
  AlwaysEmptyObject<T>,
  MaybeEmptyObject<T>,
  WalkObject<T, R>
>;

/* -------------------------------------------------------------------------- */
/* the walk                                                                   */
/* -------------------------------------------------------------------------- */

type Convert<T, R extends ResolvedOptions, Nested extends boolean> = IsAny<T> extends true
  ? any
  : [T] extends [never]
    ? never
    : IsUnknown<T> extends true
      ? unknown
      : ConvertValue<T, R, Nested>;

// Mirrors `convert()` step by step. `Nested` is true for everything below the
// top level, where `deep: false` short-circuits containers before the empty
// checks can run.
type ConvertValue<T, R extends ResolvedOptions, Nested extends boolean> = T extends undefined | void
  ? Branch<R['undefinedToNull'], null, undefined>
  : T extends null
    ? null
    : T extends string
      ? BlankedString<T, R['trim']>
      : T extends Primitive
        ? T
        : T extends Opaque
          ? T
          : T extends readonly unknown[]
            ? [Nested] extends [false]
              ? ConvertArray<T, R>
              : Branch<R['deep'], ConvertArray<T, R>, T>
            : [Nested] extends [false]
              ? ConvertObject<T, R>
              : Branch<R['deep'], ConvertObject<T, R>, T>;

/**
 * The result of `blankToNull(input, options)`.
 *
 * The second argument is the options object *as written at the call site*, so
 * the result follows the options that were actually passed. A wide `boolean`
 * option yields the union of both outcomes rather than a guess.
 *
 * @example
 * ```ts
 * type A = Blanked<{ name: string; age: number }>;   // { name: string | null; age: number }
 * type B = Blanked<'  '>;                            // null      — trimmed away
 * type C = Blanked<'  ', { trim: false }>;           // '  '      — kept as is
 * type D = Blanked<string[], { emptyArrayToNull: true }>; // (string | null)[] | null
 * ```
 */
export type Blanked<T, O extends BlankToNullOptions = {}> = Convert<T, Resolve<O>, false>;

/* -------------------------------------------------------------------------- */
/* pruneNull                                                                  */
/* -------------------------------------------------------------------------- */

type Nullish = null | undefined;

// A key survives untouched when its value can never be null or undefined.
type PrunedRequired<T> = {
  -readonly [K in keyof T as [Extract<T[K], Nullish>] extends [never] ? K : never]-?: Pruned<T[K]>;
};

// A key that may be nullish may be dropped, so it becomes optional. A key that
// is always nullish is always dropped, so it disappears entirely.
type PrunedOptional<T> = {
  -readonly [K in keyof T as [Extract<T[K], Nullish>] extends [never]
    ? never
    : [Exclude<T[K], Nullish>] extends [never]
      ? never
      : K]?: Pruned<Exclude<T[K], Nullish>>;
};

type PruneObject<T> = Prettify<PrunedRequired<T> & PrunedOptional<T>>;

type PruneValue<T> = T extends Nullish | void
  ? T
  : T extends string | Primitive
    ? T
    : T extends Opaque
      ? T
      : T extends readonly unknown[]
        ? { -readonly [K in keyof T]: Pruned<T[K]> }
        : PruneObject<T>;

/**
 * The result of `pruneNull(input)`.
 *
 * Object keys that can hold `null` or `undefined` become optional, keys that
 * always hold one of them are removed, and keys that can hold neither stay
 * required. Array positions are never dropped, so array types keep their shape.
 *
 * @example
 * ```ts
 * type A = Pruned<{ id: number; bio: string | null }>; // { id: number; bio?: string }
 * type B = Pruned<{ gone: null }>;                     // {}
 * type C = Pruned<(number | null)[]>;                  // (number | null)[]
 * ```
 */
export type Pruned<T> = IsAny<T> extends true
  ? any
  : [T] extends [never]
    ? never
    : IsUnknown<T> extends true
      ? unknown
      : PruneValue<T>;
