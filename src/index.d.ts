export interface BlankToNullOptions {
  /** Trim strings before testing for emptiness. Default: true */
  trim?: boolean;
  /** Walk into plain objects and arrays. Default: true */
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

/** True for null, undefined, blank string, empty array and empty plain object. */
export function isBlank(value: unknown, options?: IsBlankOptions): boolean;

/** Returns a copy where blank strings and `undefined` become `null`. */
export function blankToNull<T>(input: T, options?: BlankToNullOptions): unknown;

/** Returns a copy of plain objects with `null`/`undefined` keys removed. Array holes are preserved. */
export function pruneNull<T>(input: T): unknown;

export default blankToNull;
