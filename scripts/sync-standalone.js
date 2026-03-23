/**
 * Após `next build` com output standalone, o servidor em `.next/standalone/server.js`
 * espera `.next/static` e `public` *dentro* de `.next/standalone/`.
 * Sem essa cópia, o HTML renderiza mas CSS/JS/imagens quebram (404).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const standalone = path.join(root, '.next', 'standalone');
const serverJs = path.join(standalone, 'server.js');

if (!fs.existsSync(serverJs)) {
  console.warn('[sync-standalone] Sem .next/standalone/server.js — nada a sincronizar.');
  process.exit(0);
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  rmrf(dest);
  fs.cpSync(src, dest, { recursive: true });
}

const pubSrc = path.join(root, 'public');
const pubDest = path.join(standalone, 'public');
if (fs.existsSync(pubSrc)) {
  copyDir(pubSrc, pubDest);
  console.log('[sync-standalone] public → .next/standalone/public');
}

const staticSrc = path.join(root, '.next', 'static');
const staticDest = path.join(standalone, '.next', 'static');
if (!fs.existsSync(staticSrc)) {
  console.error('[sync-standalone] Falta .next/static — rode o build antes.');
  process.exit(1);
}
copyDir(staticSrc, staticDest);
console.log('[sync-standalone] .next/static → .next/standalone/.next/static');
