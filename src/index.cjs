// Kept so any consumer pinned to the old file path keeps resolving. The runtime
// lives in ./index.js: bundlers that only whitelist .js/.mjs (create-react-app 5
// ships a catch-all asset rule that turns an imported .cjs into a URL string)
// must never have to load a .cjs file.
module.exports = require('./index.js');
