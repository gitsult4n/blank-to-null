import blankToNull, { isBlank, pruneNull } from 'blank-to-null';
import type { Blanked, Pruned, BlankToNullOptions, IsBlankOptions } from 'blank-to-null';
// --- shared battery below ---

type Eq<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
const expect = <T extends true>(_: T) => {};
const expectFalse = <T extends false>(_: T) => {};

/* ========================================================================== */
/* mandatory baseline                                                         */
/* ========================================================================== */

expect<Eq<Blanked<string>, string | null>>(true);
expect<Eq<Blanked<'a'>, 'a'>>(true);
expect<Eq<Blanked<''>, null>>(true);

// DEVIATION 1: the baseline asks for `'  ' | null`. Default `trim` is `true`, and
// the runtime asserts `blankToNull('   ') === null`, so `null` is the exact answer.
// `'  ' | null` is the pre-options result and contradicts the assertion below it.
expect<Eq<Blanked<'  '>, null>>(true);
expectFalse<Eq<Blanked<'  '>, '  ' | null>>(false);

expect<Eq<Blanked<'  ', { trim: false }>, '  '>>(true);
expect<Eq<Blanked<'  ', { trim: true }>, null>>(true);
expect<Eq<Blanked<'  ', { trim: boolean }>, '  ' | null>>(true);

// DEVIATION 2: the baseline asks for `' a '`. With `trim` on, the runtime returns
// the trimmed string (`blankToNull('  Bio  ') === 'Bio'`), and `' a '` is a type
// the runtime can never produce, so claiming it violates the soundness rule.
expect<Eq<Blanked<' a '>, 'a'>>(true);
expectFalse<Eq<Blanked<' a '>, ' a '>>(false);

expect<Eq<Blanked<' a ', { trim: false }>, ' a '>>(true);
expect<Eq<Blanked<'a' | ''>, 'a' | null>>(true);
expect<Eq<Blanked<string, { trim: false }>, string | null>>(true);
expect<Eq<Blanked<undefined>, null>>(true);
expect<Eq<Blanked<undefined, { undefinedToNull: false }>, undefined>>(true);
expect<Eq<Blanked<undefined, { undefinedToNull: boolean }>, null | undefined>>(true);
expect<Eq<Blanked<null>, null>>(true);
expect<Eq<Blanked<number>, number>>(true);
expect<Eq<Blanked<0>, 0>>(true);
expect<Eq<Blanked<boolean>, boolean>>(true);
expect<Eq<Blanked<Date>, Date>>(true);
expect<Eq<Blanked<never>, never>>(true);
expect<Eq<Blanked<string | undefined>, string | null>>(true);
expect<Eq<Blanked<{ a: string }>, { a: string | null }>>(true);
expect<Eq<Blanked<{ a?: string }>, { a?: string | null }>>(true);
expect<Eq<Blanked<string[]>, (string | null)[]>>(true);
expect<Eq<Blanked<readonly string[]>, (string | null)[]>>(true);
expect<Eq<Blanked<[]>, []>>(true);
expect<Eq<Blanked<[], { emptyArrayToNull: true }>, null>>(true);
expect<Eq<Blanked<string[], { emptyArrayToNull: true }>, (string | null)[] | null>>(true);
expect<Eq<Blanked<[string], { emptyArrayToNull: true }>, [string | null]>>(true);
expect<Eq<Blanked<{}, { emptyObjectToNull: true }>, null>>(true);
expect<Eq<Blanked<{ a: string }, { emptyObjectToNull: true }>, { a: string | null }>>(true);
expect<Eq<Blanked<{ a?: string }, { emptyObjectToNull: true }>, { a?: string | null } | null>>(true);
expect<
  Eq<
    Blanked<{ a: string; b: { c: string } }, { deep: false }>,
    { a: string | null; b: { c: string } }
  >
>(true);
expect<Eq<Blanked<string[][], { deep: false }>, string[][]>>(true);
expect<Eq<Blanked<{ a: Date }>, { a: Date }>>(true);

/* ========================================================================== */
/* mandatory end-to-end (inference through the real call)                     */
/* ========================================================================== */

expect<Eq<typeof e1, '  '>>(true);
const e1 = blankToNull('  ', { trim: false });

expect<Eq<typeof e2, { tags: null }>>(true);
const e2 = blankToNull({ tags: [] }, { emptyArrayToNull: true });

// DEVIATION 3: the baseline asks for `{ a: null; b: { c: string } }`. TypeScript
// widens object-literal property types, so `a` arrives as `string`, not `''`, and
// `string | null` is the exact result for it. `b` matches. Asking for `a: null`
// and `b: { c: string }` at once is impossible: with `as const` (or a `const`
// type parameter) `b` would come back `{ readonly c: '' }` instead.
expect<Eq<typeof e3, { a: string | null; b: { c: string } }>>(true);
const e3 = blankToNull({ a: '', b: { c: '' } }, { deep: false });
// the closest thing that does give `a: null`, at the cost of `b`:
expect<Eq<typeof e3b, { a: null; b: { readonly c: '' } }>>(true);
const e3b = blankToNull({ a: '', b: { c: '' } } as const, { deep: false });

expect<Eq<typeof e4, undefined>>(true);
const e4 = blankToNull(undefined, { undefinedToNull: false });

expect<Eq<typeof e5, { a: string | null; b: number }>>(true);
const e5 = blankToNull({ a: '  Ada  ', b: 0 });

/* ========================================================================== */
/* inference extras                                                           */
/* ========================================================================== */

// Top-level literals survive inference, so the type tracks the runtime exactly.
expect<Eq<ReturnType<typeof blankToNull<'  Bio  ', {}>>, 'Bio'>>(true);
const i1 = blankToNull('  Bio  ');
expect<Eq<typeof i1, 'Bio'>>(true);
const i2 = blankToNull('');
expect<Eq<typeof i2, null>>(true);
const i3 = blankToNull(0);
expect<Eq<typeof i3, 0>>(true);
const i4 = blankToNull(null);
expect<Eq<typeof i4, null>>(true);
const i5 = blankToNull(undefined);
expect<Eq<typeof i5, null>>(true);
const i6 = blankToNull({ a: '  ' }, { deep: true, trim: true, emptyObjectToNull: false });
expect<Eq<typeof i6, { a: string | null }>>(true);

// An options object held in a variable is still read precisely.
const opts = { trim: false } as const;
const i7 = blankToNull('  ', opts);
expect<Eq<typeof i7, '  '>>(true);

// A non-literal boolean widens to the sound union instead of guessing.
declare const wide: boolean;
const i8 = blankToNull('  ', { trim: wide });
expect<Eq<typeof i8, '  ' | null>>(true);

// An explicit `undefined` option falls back to the default, like `?? DEFAULTS`.
const i9 = blankToNull('  ', { trim: undefined });
expect<Eq<typeof i9, null>>(true);
const i10 = blankToNull(undefined, { undefinedToNull: undefined });
expect<Eq<typeof i10, null>>(true);

// `unknown`, `any` and a caller's own type parameter all stay accepted.
declare const u: unknown;
const i11 = blankToNull(u);
expect<Eq<typeof i11, unknown>>(true);
declare const anyValue: any;
const i12 = blankToNull(anyValue);
expect<Eq<typeof i12, any>>(true);
function passThrough<X>(x: X) {
  return blankToNull(x);
}
expect<Eq<ReturnType<typeof passThrough<string>>, string | null>>(true);
function passThroughOpts<X, O extends BlankToNullOptions>(x: X, o: O) {
  return blankToNull(x, o);
}
expect<Eq<ReturnType<typeof passThroughOpts<string, { trim: false }>>, string | null>>(true);

// isBlank / pruneNull signatures
expect<Eq<ReturnType<typeof isBlank>, boolean>>(true);
isBlank('  ', { trim: false });
isBlank(u);
const blankOpts: IsBlankOptions = { trim: true };
isBlank('', blankOpts);
const p1 = pruneNull({ a: 1, b: null });
expect<Eq<typeof p1, { a: number }>>(true);

/* ========================================================================== */
/* strings                                                                    */
/* ========================================================================== */

expect<Eq<Blanked<'\t\n'>, null>>(true);
expect<Eq<Blanked<'\t\n', { trim: false }>, '\t\n'>>(true);
expect<Eq<Blanked<'  a  b  '>, 'a  b'>>(true);
expect<Eq<Blanked<'\u00a0x\u3000'>, 'x'>>(true);
expect<Eq<Blanked<'' | '  ' | ' a ' | 'b'>, null | 'a' | 'b'>>(true);
expect<Eq<Blanked<'' | '  ' | ' a ' | 'b', { trim: false }>, null | '  ' | ' a ' | 'b'>>(true);
expect<Eq<Blanked<string | 'a'>, string | null>>(true);
// template literal types degrade to a sound superset
expect<Eq<Blanked<`a${string}`>, `a${string}`>>(true);
expect<Eq<Blanked<`${string} `>, string | null>>(true);
expect<Eq<Blanked<`${number}`>, `${number}`>>(true);
// string enums keep their member type
enum Tag {
  Ok = 'ok',
  Blank = '  ',
}
expect<Eq<Blanked<Tag.Ok>, Tag.Ok>>(true);
expect<Eq<Blanked<Tag.Blank>, null>>(true);
expect<Eq<Blanked<Tag.Blank, { trim: false }>, Tag.Blank>>(true);

/* ========================================================================== */
/* tuples, rest and optional elements                                         */
/* ========================================================================== */

expect<Eq<Blanked<[string, number]>, [string | null, number]>>(true);
expect<Eq<Blanked<readonly [string, number]>, [string | null, number]>>(true);
expect<Eq<Blanked<[string?]>, [(string | null)?]>>(true);
expect<Eq<Blanked<[string, ...string[]]>, [string | null, ...(string | null)[]]>>(true);
expect<Eq<Blanked<[first: string, second: number]>, [first: string | null, second: number]>>(true);
expect<Eq<Blanked<string[][]>, (string | null)[][]>>(true);
expect<Eq<Blanked<[[string]]>, [[string | null]]>>(true);
expect<Eq<Blanked<never[]>, never[]>>(true);
expect<Eq<Blanked<undefined[]>, null[]>>(true);
expect<Eq<Blanked<(string | undefined)[]>, (string | null)[]>>(true);

// emptyArrayToNull only adds null where length 0 is reachable
expect<Eq<Blanked<never[], { emptyArrayToNull: true }>, null>>(true);
expect<Eq<Blanked<readonly [], { emptyArrayToNull: true }>, null>>(true);
expect<Eq<Blanked<[], { emptyArrayToNull: boolean }>, [] | null>>(true);
expect<
  Eq<
    Blanked<[string, ...string[]], { emptyArrayToNull: true }>,
    [string | null, ...(string | null)[]]
  >
>(true);
expect<Eq<Blanked<[string?], { emptyArrayToNull: true }>, [(string | null)?] | null>>(true);
expect<Eq<Blanked<[string, number], { emptyArrayToNull: true }>, [string | null, number]>>(true);
expect<Eq<Blanked<string[][], { emptyArrayToNull: true }>, ((string | null)[] | null)[] | null>>(
  true,
);

/* ========================================================================== */
/* objects, index signatures, symbols                                         */
/* ========================================================================== */

expect<Eq<Blanked<{}>, {}>>(true);
expect<Eq<Blanked<{ readonly a: string }>, { a: string | null }>>(true);
expect<Eq<Blanked<{ a: string } & { b?: number }>, { a: string | null; b?: number | null }>>(true);
expect<Eq<Blanked<Record<string, string>>, Record<string, string | null>>>(true);
expect<Eq<Blanked<Record<string, string>, { emptyObjectToNull: true }>, Record<string, string | null> | null>>(
  true,
);
expect<
  Eq<
    Blanked<{ [k: string]: string | number; a: number }, { emptyObjectToNull: true }>,
    { [k: string]: string | number | null; a: number }
  >
>(true);
expect<Eq<Blanked<{ [k: symbol]: string }>, { [k: symbol]: string | null }>>(true);
declare const sym: unique symbol;
expect<Eq<Blanked<{ [sym]: string }>, { [sym]: string | null }>>(true);
expect<Eq<Blanked<{ [sym]: string }, { emptyObjectToNull: true }>, { [sym]: string | null }>>(true);
expect<Eq<Blanked<{ [sym]?: string }, { emptyObjectToNull: true }>, { [sym]?: string | null } | null>>(
  true,
);
expect<Eq<Blanked<{ a?: string; b?: number }, { emptyObjectToNull: true }>, { a?: string | null; b?: number | null } | null>>(
  true,
);
expect<Eq<Blanked<{ a: unknown }>, { a: unknown }>>(true);
expect<Eq<Blanked<{ a: any }>, { a: any }>>(true);
expect<Eq<Blanked<{ a: never }>, { a: never }>>(true);
expect<Eq<Blanked<{ fn: (x: string) => number }>, { fn: (x: string) => number }>>(true);
expect<Eq<Blanked<{ ctor: new () => Date }>, { ctor: new () => Date }>>(true);
expect<
  Eq<
    Blanked<{ d: Date; m: Map<string, string>; s: Set<string>; p: Promise<string>; r: RegExp; e: Error; buf: Uint8Array }>,
    { d: Date; m: Map<string, string>; s: Set<string>; p: Promise<string>; r: RegExp; e: Error; buf: Uint8Array }
  >
>(true);

/* ========================================================================== */
/* wide / unresolved options are sound unions                                 */
/* ========================================================================== */

expect<Eq<Blanked<{ a: { b: string } }, { deep: boolean }>, { a: { b: string } | { b: string | null } }>>(
  true,
);
expect<Eq<Blanked<{ a: string }, BlankToNullOptions>, { a: string | null }>>(true);
expect<Eq<Blanked<{ a?: string }, BlankToNullOptions>, { a?: string | null } | null>>(true);
expect<Eq<Blanked<'  ', BlankToNullOptions>, '  ' | null>>(true);
expect<Eq<Blanked<undefined, BlankToNullOptions>, null | undefined>>(true);
expect<Eq<Blanked<[], BlankToNullOptions>, [] | null>>(true);
expect<Eq<Blanked<unknown>, unknown>>(true);
expect<Eq<Blanked<any>, any>>(true);
expect<Eq<Blanked<object>, object>>(true);
expect<Eq<Blanked<void>, null>>(true);
expect<Eq<Blanked<void, { undefinedToNull: false }>, undefined>>(true);
expect<Eq<Blanked<{ a: string } | string[]>, { a: string | null } | (string | null)[]>>(true);
expect<Eq<Blanked<{ a: string } | null | undefined>, { a: string | null } | null>>(true);

/* ========================================================================== */
/* recursion safety                                                           */
/* ========================================================================== */

interface Node1 {
  name: string;
  kids: Node1[];
}
type BlankedNode = Blanked<Node1>;
declare const node: BlankedNode;
const nodeName: string | null = node.name;
const nodeKid: BlankedNode = node.kids[0]!;
const nodeDeep: string | null = node.kids[0]!.kids[0]!.kids[0]!.name;
expect<Eq<typeof nodeKid, BlankedNode>>(true);
void nodeName;
void nodeDeep;

type PrunedNode = Pruned<Node1>;
declare const pnode: PrunedNode;
const pnodeName: string = pnode.name;
const pnodeKid: PrunedNode = pnode.kids[0]!;
void pnodeName;
void pnodeKid;

// mutually recursive
interface A1 {
  b: B1;
  s: string;
}
interface B1 {
  a?: A1;
  s: string;
}
expect<Eq<Blanked<A1>['s'], string | null>>(true);
expect<Eq<Blanked<A1>['b']['s'], string | null>>(true);
expect<Eq<Pruned<A1>['b']['s'], string>>(true);

// recursion with a wide `deep` flag, which unions at every level
type WideDeepNode = Blanked<Node1, { deep: boolean }>;
declare const wnode: WideDeepNode;
void wnode;

// 12 levels of nesting
type L12 = { v: string; n: { v: string; n: { v: string; n: { v: string; n: { v: string; n: { v: string; n: { v: string; n: { v: string; n: { v: string; n: { v: string; n: { v: string; n: { v: string } } } } } } } } } } } };
type B12 = Blanked<L12>;
expect<Eq<B12['n']['n']['n']['n']['n']['n']['n']['n']['n']['n']['v'], string | null>>(true);
type B12Shallow = Blanked<L12, { deep: false }>;
expect<Eq<B12Shallow['n'], L12['n']>>(true);
type P12 = Pruned<L12>;
expect<Eq<P12['n']['n']['n']['n']['n']['n']['n']['n']['n']['n']['v'], string>>(true);

// a deeply nested array/tuple mix
type DeepArr = [[[[[[[[[[string]]]]]]]]]];
expect<Eq<Blanked<DeepArr>, [[[[[[[[[[string | null]]]]]]]]]]>>(true);

/* ========================================================================== */
/* class instances (structurally indistinguishable from plain objects)        */
/* ========================================================================== */

class User {
  name = '';
  greet(): string {
    return this.name;
  }
}
// Walking a class instance is a widening, so it stays sound for Blanked.
const walkedUser: Blanked<User> = new User();
void walkedUser;

/* ========================================================================== */
/* Pruned                                                                     */
/* ========================================================================== */

expect<Eq<Pruned<{ a: number; b: string | null }>, { a: number; b?: string }>>(true);
expect<Eq<Pruned<{ a: number }>, { a: number }>>(true);
expect<Eq<Pruned<{ a?: string }>, { a?: string }>>(true);
expect<Eq<Pruned<{ a: null }>, {}>>(true);
expect<Eq<Pruned<(number | null)[]>, (number | null)[]>>(true);
expect<Eq<Pruned<[number, null]>, [number, null]>>(true);
expect<Eq<Pruned<Date>, Date>>(true);
expect<Eq<Pruned<number>, number>>(true);
expect<Eq<Pruned<{ a: { b: string | null } }>, { a: { b?: string } }>>(true);

expect<Eq<Pruned<{ a: undefined }>, {}>>(true);
expect<Eq<Pruned<{ a: null | undefined }>, {}>>(true);
expect<Eq<Pruned<{ a: string | undefined }>, { a?: string }>>(true);
expect<Eq<Pruned<{ a: string | null | undefined }>, { a?: string }>>(true);
expect<Eq<Pruned<{ readonly a: number }>, { a: number }>>(true);
expect<Eq<Pruned<{ a: number; b: null; c?: string }>, { a: number; c?: string }>>(true);
expect<Eq<Pruned<null>, null>>(true);
expect<Eq<Pruned<undefined>, undefined>>(true);
expect<Eq<Pruned<string>, string>>(true);
expect<Eq<Pruned<never>, never>>(true);
expect<Eq<Pruned<unknown>, unknown>>(true);
expect<Eq<Pruned<any>, any>>(true);
expect<Eq<Pruned<readonly [number, null]>, [number, null]>>(true);
expect<Eq<Pruned<{ a: Date | null }>, { a?: Date }>>(true);
expect<Eq<Pruned<{ [sym]: string | null }>, { [sym]?: string }>>(true);
expect<Eq<Pruned<{ a: { b: null } }>, { a: {} }>>(true);
expect<Eq<Pruned<{ a: string } | { b: null }>, { a: string } | {}>>(true);
expect<Eq<Pruned<[string | null, ...(number | null)[]]>, [string | null, ...(number | null)[]]>>(
  true,
);
expect<Eq<Pruned<{ a: (string | null)[] }>, { a: (string | null)[] }>>(true);
expect<Eq<Pruned<{ fn: () => void }>, { fn: () => void }>>(true);
// an index signature can always be missing a key, so it becomes optional
expect<Eq<Pruned<Record<string, string | null>>, { [k: string]: string | undefined }>>(true);

// the documented pipeline: blankToNull then pruneNull
const cleaned = pruneNull(blankToNull({ name: ' Ada ', bio: '   ', age: 0 }));
expect<Eq<typeof cleaned, { name?: string; bio?: string; age: number }>>(true);
