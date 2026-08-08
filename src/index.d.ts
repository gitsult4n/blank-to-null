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

/** Objects that are values to the caller, not containers to walk into. */
type Opaque = Date | RegExp | Map<unknown, unknown> | Set<unknown> | WeakMap<object, unknown> | WeakSet<object> | Promise<unknown> | Error | ((...args: never[]) => unknown);

export type Blanked<T> = [T] extends [never]
  ? never
  : T extends string
    ? string | null
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

/** True for null, undefined, blank string, empty array and empty plain object. */
export function isBlank(value: unknown, options?: IsBlankOptions): boolean;

/**
 * Returns a copy where blank strings and `undefined` become `null`.
 * Array holes are materialized as `null`; extra properties set on an array are not copied.
 */
export function blankToNull<T>(input: T, options?: BlankToNullOptions): Blanked<T>;

/**
 * Returns a copy of plain objects with `null`/`undefined` keys removed.
 * Array positions are preserved, so array entries are never dropped.
 */
export function pruneNull<T>(input: T): Pruned<T>;

export default blankToNull;
