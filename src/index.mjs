// The implementation lives in CommonJS so both entry points share one module
// instance; this wrapper only re-exports it under ESM names.
import blankToNull from './index.js';

export const isBlank = blankToNull.isBlank;
export const pruneNull = blankToNull.pruneNull;
export { blankToNull };
export default blankToNull;
