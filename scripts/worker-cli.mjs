import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Keep local development artifacts within this repository.
const configDirectory = resolve('work/config');
mkdirSync(configDirectory, { recursive: true });
const result = spawnSync(process.execPath, [resolve('node_modules/wrangler/bin/wrangler.js'), ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, XDG_CONFIG_HOME: configDirectory, WRANGLER_LOG_PATH: resolve('work/wrangler.log'), WRANGLER_SEND_METRICS: 'false' }
});
if (result.error) { console.error(result.error.message); process.exit(1); }
process.exit(result.status ?? 1);
