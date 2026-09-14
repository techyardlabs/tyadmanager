// Root entry point for hosting providers (Hostinger, cPanel, Render, Heroku, Plesk, Cloud Run)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bundledServer = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(bundledServer)) {
  await import('./dist/server.cjs');
} else {
  console.log('Production server bundle not found at dist/server.cjs. Please execute "npm run build" first.');
  process.exit(1);
}

