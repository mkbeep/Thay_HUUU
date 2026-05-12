const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'web-app');
const redirects = path.join(root, 'public', '_redirects');

if (!fs.existsSync(out)) {
  console.warn('copy-web-assets: web-app missing, skip');
  process.exit(0);
}
if (fs.existsSync(redirects)) {
  fs.copyFileSync(redirects, path.join(out, '_redirects'));
  console.log('copy-web-assets: _redirects -> web-app');
}
