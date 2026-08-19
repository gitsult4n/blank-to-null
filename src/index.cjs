const DEFAULTS = {
  trim: true,
  deep: true,
  undefinedToNull: true,
  emptyArrayToNull: false,
  emptyObjectToNull: false,
};

const objectProto = Object.prototype;
const { propertyIsEnumerable } = objectProto;

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === objectProto || proto === null;
}

function ownKeys(value) {
  const keys = Object.keys(value);
  for (const symbol of Object.getOwnPropertySymbols(value)) {
    if (propertyIsEnumerable.call(value, symbol)) keys.push(symbol);
  }
  return keys;
}

// A plain assignment routes an own `__proto__` key through the inherited setter,
// which drops the key and rewrites the copy's prototype. JSON.parse output always
// carries such a key when the payload has one.
function define(target, key, value) {
  Object.defineProperty(target, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

function emptyLike(value) {
  return Object.getPrototypeOf(value) === null ? Object.create(null) : {};
}

function resolve(options) {
  return {
    trim: options?.trim ?? DEFAULTS.trim,
    deep: options?.deep ?? DEFAULTS.deep,
    undefinedToNull: options?.undefinedToNull ?? DEFAULTS.undefinedToNull,
    emptyArrayToNull: options?.emptyArrayToNull ?? DEFAULTS.emptyArrayToNull,
    emptyObjectToNull: options?.emptyObjectToNull ?? DEFAULTS.emptyObjectToNull,
  };
}

function isBlank(value, options) {
  const trim = options?.trim ?? DEFAULTS.trim;
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return (trim ? value.trim() : value) === '';
  if (Array.isArray(value)) return value.length === 0;
  if (isPlainObject(value)) return ownKeys(value).length === 0;
  return false;
}

function blankToNull(input, options) {
  return convert(input, resolve(options), new WeakMap(), 0);
}

function convert(value, opts, seen, depth) {
  if (value === undefined) return opts.undefinedToNull ? null : undefined;
  if (value === null) return null;

  if (typeof value === 'string') {
    const next = opts.trim ? value.trim() : value;
    return next === '' ? null : next;
  }

  if (typeof value !== 'object') return value;

  // Dates, Maps, Sets, class instances and other exotic objects are values to
  // the caller, not containers to walk into.
  if (!Array.isArray(value) && !isPlainObject(value)) return value;

  // Shallow mode walks the top level only; nested containers stay by reference.
  if (!opts.deep && depth > 0) return value;

  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const out = [];
    seen.set(value, out);
    for (const item of value) out.push(convert(item, opts, seen, depth + 1));
    if (opts.emptyArrayToNull && out.length === 0) {
      seen.set(value, null);
      return null;
    }
    return out;
  }

  const out = emptyLike(value);
  seen.set(value, out);
  for (const key of ownKeys(value)) define(out, key, convert(value[key], opts, seen, depth + 1));
  if (opts.emptyObjectToNull && ownKeys(out).length === 0) {
    seen.set(value, null);
    return null;
  }
  return out;
}

function pruneNull(input) {
  return prune(input, new WeakMap());
}

function prune(value, seen) {
  if (value === null || typeof value !== 'object') return value;
  if (!Array.isArray(value) && !isPlainObject(value)) return value;
  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const out = [];
    seen.set(value, out);
    for (const item of value) out.push(prune(item, seen));
    return out;
  }

  const out = emptyLike(value);
  seen.set(value, out);
  for (const key of ownKeys(value)) {
    const next = value[key];
    if (next === null || next === undefined) continue;
    define(out, key, prune(next, seen));
  }
  return out;
}

module.exports = blankToNull;
module.exports.default = blankToNull;
module.exports.blankToNull = blankToNull;
module.exports.isBlank = isBlank;
module.exports.pruneNull = pruneNull;
