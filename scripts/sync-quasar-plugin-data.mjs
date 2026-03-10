import { promises as fs } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '..');
const sourceDataDir = path.join(rootDir, 'data');
const targetDataDir = path.join(rootDir, 'tools', 'quasar-plugin', 'src', 'data');
const legacyPublicDir = path.join(rootDir, 'tools', 'quasar-plugin', 'public', 'legacy');

const syncEntries = [
  { source: 'weapons.js', target: 'weapons.json', extract: (win) => win.WEAPONS },
  { source: 'dungeons.js', target: 'dungeons.json', extract: (win) => win.DUNGEONS },
  { source: 'gears.js', target: 'gears.json', extract: (win) => win.GEARS },
  { source: 'characters.js', target: 'characters.json', extract: (win) => win.characters ?? [] },
  { source: 'up-schedules.js', target: 'up-schedules.json', extract: (win) => win.WEAPON_UP_SCHEDULES },
  { source: 'weapon-images.js', target: 'weapon-images.json', extract: (win) => win.WEAPON_IMAGES },
  { source: 'content.js', target: 'content.json', extract: (win) => win.CONTENT },
];

function createContext() {
  const window = {};
  return vm.createContext({ window, console });
}

async function evaluateScript(filePath, context) {
  const code = await fs.readFile(filePath, 'utf8');
  vm.runInContext(code, context, { filename: filePath, timeout: 5000 });
}

function ensureSerializable(name, value) {
  if (value === undefined) {
    throw new Error(`missing data export: ${name}`);
  }
  JSON.stringify(value);
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function syncBaseData() {
  const summary = [];
  for (const entry of syncEntries) {
    const context = createContext();
    const sourcePath = path.join(sourceDataDir, entry.source);
    await evaluateScript(sourcePath, context);
    const payload = entry.extract(context.window);
    ensureSerializable(entry.source, payload);
    const targetPath = path.join(targetDataDir, entry.target);
    await writeJson(targetPath, payload);
    summary.push({ source: entry.source, target: entry.target, count: Array.isArray(payload) ? payload.length : Object.keys(payload).length });
  }
  return summary;
}

async function syncI18nData() {
  const context = createContext();
  await evaluateScript(path.join(sourceDataDir, 'i18n.js'), context);
  const i18nDir = path.join(sourceDataDir, 'i18n');
  const files = (await fs.readdir(i18nDir)).filter((item) => item.endsWith('.js')).sort();

  for (const file of files) {
    await evaluateScript(path.join(i18nDir, file), context);
  }

  const i18nPayload = context.window.I18N ?? {};
  ensureSerializable('i18n', i18nPayload);
  await writeJson(path.join(targetDataDir, 'i18n.json'), i18nPayload);

  return { locales: Object.keys(i18nPayload).sort() };
}

function verifyContracts(dataset) {
  if (!Array.isArray(dataset.weapons) || dataset.weapons.length === 0) {
    throw new Error('weapons contract failed');
  }
  if (!Array.isArray(dataset.dungeons) || dataset.dungeons.length === 0) {
    throw new Error('dungeons contract failed');
  }
  if (dataset.weapons.some((item) => !item.name || typeof item.rarity !== 'number')) {
    throw new Error('weapons field contract failed');
  }
  if (dataset.dungeons.some((item) => !item.id || !Array.isArray(item.s2_pool) || !Array.isArray(item.s3_pool))) {
    throw new Error('dungeons field contract failed');
  }
}

async function main() {
  await fs.mkdir(targetDataDir, { recursive: true });
  await fs.rm(legacyPublicDir, { recursive: true, force: true });

  const summary = await syncBaseData();
  const i18nSummary = await syncI18nData();

  const dataset = {
    weapons: JSON.parse(await fs.readFile(path.join(targetDataDir, 'weapons.json'), 'utf8')),
    dungeons: JSON.parse(await fs.readFile(path.join(targetDataDir, 'dungeons.json'), 'utf8')),
  };

  verifyContracts(dataset);

  const report = {
    generatedAt: new Date().toISOString(),
    targetDataDir,
    summary,
    i18n: i18nSummary,
  };

  await fs.writeFile(path.join(targetDataDir, '_sync-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
