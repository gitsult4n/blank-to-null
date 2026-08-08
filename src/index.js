const DEFAULTS = {
  trim: true,
  deep: true,
  undefinedToNull: true,
  emptyArrayToNull: false,
  emptyObjectToNull: false,
};

const objectProto = Object.prototype;

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === objectProto || proto === null;
}

export function isBlank(value, options = {}) {
  const trim = options.trim ?? DEFAULTS.trim;
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return (trim ? value.trim() : value) === '';
  if (Array.isArray(value)) return value.length === 0;
  if (isPlainObject(value)) return Object.keys(value).length === 0;
  return false;
}

export function blankToNull(input, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  return convert(input, opts, new WeakMap());
}

function convert(value, opts, seen) {
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

  if (!opts.deep) return value;

  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const out = [];
    seen.set(value, out);
    for (const item of value) out.push(convert(item, opts, seen));
    return opts.emptyArrayToNull && out.length === 0 ? null : out;
  }

  const out = {};
  seen.set(value, out);
  for (const key of Object.keys(value)) out[key] = convert(value[key], opts, seen);
  return opts.emptyObjectToNull && Object.keys(out).length === 0 ? null : out;
}

export function pruneNull(input) {
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

  const out = {};
  seen.set(value, out);
  for (const key of Object.keys(value)) {
    const next = value[key];
    if (next === null || next === undefined) continue;
    out[key] = prune(next, seen);
  }
  return out;
}

export default blankToNull;
