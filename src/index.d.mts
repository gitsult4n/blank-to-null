// TypeScript reads a bare .d.ts as CommonJS in a package without "type": "module",
// so the ESM entry needs its own .d.mts to match index.mjs.
import type { BlankToNullOptions, IsBlankOptions, Blanked, Pruned } from './types.js';

export type { BlankToNullOptions, IsBlankOptions, Blanked, Pruned };

/** True for null, undefined, blank string, empty array and empty plain object. */
export declare function isBlank(value: unknown, options?: IsBlankOptions): boolean;

/**
 * Returns a copy where blank strings and `undefined` become `null`.
 * Array holes are materialized as `null`; extra properties set on an array are not copied.
 */
export declare function blankToNull<T>(input: T, options?: BlankToNullOptions): Blanked<T>;

/**
 * Returns a copy of plain objects with `null`/`undefined` keys removed.
 * Array positions are preserved, so array entries are never dropped.
 */
export declare function pruneNull<T>(input: T): Pruned<T>;

export default blankToNull;
