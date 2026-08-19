// Generates the CommonJS twin of assert.mts so both module formats run the exact
// same battery and cannot drift apart. Run via `npm run test:types`.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'assert.mts'), 'utf8');
const marker = '// --- shared battery below ---';
const body = source.slice(source.indexOf(marker) + marker.length);

const header = `// GENERATED from assert.mts by gen-cts.mjs. Do not edit.
import blankToNull = require('blank-to-null');
import type { Blanked, Pruned, BlankToNullOptions, IsBlankOptions } from 'blank-to-null';
const { isBlank, pruneNull } = blankToNull;

// the namespace merge exposes the same types to \`require\` consumers
type _ViaNamespace = blankToNull.Blanked<string, blankToNull.BlankToNullOptions>;
const _default: typeof blankToNull = blankToNull.default;
const _named: typeof blankToNull = blankToNull.blankToNull;
void _default;
void _named;
`;

writeFileSync(join(here, 'assert.cts'), header + body);
