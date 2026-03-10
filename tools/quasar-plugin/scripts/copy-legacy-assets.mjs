import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..', '..', '..');
const pluginRoot = path.resolve(currentDir, '..');
const legacyTargetDir = path.join(pluginRoot, 'public', 'legacy');

const legacyDirectories = ['css', 'js', 'data', 'image', 'sponsors', 'vendor'];
const legacyRootFiles = [
  'index.html',
  'favicon.ico',
  'favicon-96x96.png',
  'apple-touch-icon.png',
  'web-app-manifest-192x192.png',
  'web-app-manifest-512x512.png',
];

async function main() {
  await fs.rm(legacyTargetDir, { recursive: true, force: true });
  await fs.mkdir(legacyTargetDir, { recursive: true });

  for (const directory of legacyDirectories) {
    await fs.cp(path.join(projectRoot, directory), path.join(legacyTargetDir, directory), {
      recursive: true,
      force: true,
    });
  }

  for (const fileName of legacyRootFiles) {
    await fs.copyFile(path.join(projectRoot, fileName), path.join(legacyTargetDir, fileName));
  }

  const html = await fs.readFile(path.join(legacyTargetDir, 'index.html'), 'utf8');
  if (!html.includes('./js/bootstrap.entry.js')) {
    throw new Error('legacy index validation failed');
  }

  process.stdout.write(`${JSON.stringify({ legacyTargetDir, copiedDirs: legacyDirectories.length, copiedFiles: legacyRootFiles.length }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
