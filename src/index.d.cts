// The CJS runtime assigns the function itself to module.exports, so the CJS entry
// needs `export =` for `require('blank-to-null')` to be callable without `.default`.
import type { BlankToNullOptions, IsBlankOptions, Blanked, Pruned } from './types.js';

/**
 * Returns a copy where blank strings and `undefined` become `null`.
 * Array holes are materialized as `null`; extra properties set on an array are not copied.
 */
declare function blankToNull<T>(input: T, options?: BlankToNullOptions): Blanked<T>;

declare namespace blankToNull {
  export type { BlankToNullOptions, IsBlankOptions, Blanked, Pruned };

  /** True for null, undefined, blank string, empty array and empty plain object. */
  export function isBlank(value: unknown, options?: IsBlankOptions): boolean;

  /**
   * Returns a copy of plain objects with `null`/`undefined` keys removed.
   * Array positions are preserved, so array entries are never dropped.
   */
  export function pruneNull<T>(input: T): Pruned<T>;

  export { blankToNull, blankToNull as default };
}

export = blankToNull;
