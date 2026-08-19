export interface BlankToNullOptions {
  /** Trim strings before testing for emptiness. Default: true */
  trim?: boolean;
  /** Walk nested plain objects and arrays. When false, only the top level is converted. Default: true */
  deep?: boolean;
  /** Convert `undefined` to `null`. Default: true */
  undefinedToNull?: boolean;
  /** Convert `[]` to `null`. Default: false */
  emptyArrayToNull?: boolean;
  /** Convert `{}` to `null`. Default: false */
  emptyObjectToNull?: boolean;
}

export interface IsBlankOptions {
  /** Trim strings before testing for emptiness. Default: true */
  trim?: boolean;
}

type Whitespace = ' ' | '\t' | '\n' | '\r' | '\f' | '\v' | '\u00a0' | '\u1680' | '\u2000' | '\u2001' | '\u2002' | '\u2003' | '\u2004' | '\u2005' | '\u2006' | '\u2007' | '\u2008' | '\u2009' | '\u200a' | '\u2028' | '\u2029' | '\u202f' | '\u205f' | '\u3000' | '\ufeff';

type TrimLeft<S extends string> = S extends `${Whitespace}${infer R}` ? TrimLeft<R> : S;
type TrimRight<S extends string> = S extends `${infer R}${Whitespace}` ? TrimRight<R> : S;
type Trim<S extends string> = TrimRight<TrimLeft<S>>;

// A literal type carries enough information to say whether the result is nullable:
// `''` is always blank, a whitespace-only literal is blank unless `trim` is off, and
// any other literal is never blank. Only the wide `string` type has to stay nullable.
type BlankedString<T extends string> = string extends T
  ? string | null
  : T extends ''
    ? null
    : Trim<T> extends ''
      ? T | null
      : T;

/** Objects that are values to the caller, not containers to walk into. */
type Opaque = Date | RegExp | Map<unknown, unknown> | Set<unknown> | WeakMap<object, unknown> | WeakSet<object> | Promise<unknown> | Error | ((...args: never[]) => unknown);

export type Blanked<T> = [T] extends [never]
  ? never
  : T extends string
    ? BlankedString<T>
    : T extends undefined
      ? null
      : T extends Opaque
        ? T
        : T extends readonly (infer U)[]
          ? Blanked<U>[]
          : T extends object
            ? { [K in keyof T]: Blanked<T[K]> }
            : T;

export type Pruned<T> = T extends Opaque
  ? T
  : T extends readonly (infer U)[]
    ? Pruned<U>[]
    : T extends object
      ? { [K in keyof T]?: Pruned<NonNullable<T[K]>> }
      : T;
