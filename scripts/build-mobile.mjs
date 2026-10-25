import { build } from 'esbuild';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCatalog, openDatabase } from '../database.mjs';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const output = path.join(root, 'www');
const require = createRequire(import.meta.url);
const tesseractRoot = path.dirname(require.resolve('tesseract.js/package.json'));
const tesseractRequire = createRequire(require.resolve('tesseract.js/package.json'));
const tesseractCoreRoot = path.dirname(tesseractRequire.resolve('tesseract.js-core/package.json'));
if (path.relative(root, output) !== 'www') throw new Error('Refusing to build outside the project www directory.');

const required = [
  'mobile/index.html',
  'mobile/native-bridge.mjs',
  'ax.css',
  'ax.js',
  'ocr-data/kor.traineddata',
  'ocr-data/eng.traineddata'
];
for (const item of required) {
  if (!existsSync(path.join(root, item))) throw new Error(`Missing ${item}. Run npm install and npm run assets:ocr first.`);
}

rmSync(output, { recursive: true, force: true });
mkdirSync(path.join(output, 'data'), { recursive: true });

for (const [source, destination] of [
  ['mobile/index.html', 'index.html'],
  ['ax.css', 'ax.css'],
  ['ax.js', 'ax.js'],
  ['assets', 'assets'],
  ['ocr-data', 'ocr-data'],
  ['data/community-catalog.json', 'data/community-catalog.json'],
  [path.join(tesseractRoot, 'dist'), 'vendor/tesseract'],
  [tesseractCoreRoot, 'vendor/core']
]) {
  cpSync(path.isAbsolute(source) ? source : path.join(root, source), path.join(output, destination), { recursive: true });
}

const db = openDatabase();
try {
  writeFileSync(path.join(output, 'data/catalog.json'), `${JSON.stringify(getCatalog(db))}\n`, 'utf8');
} finally {
  db.close();
}

await build({
  entryPoints: [path.join(root, 'mobile/native-bridge.mjs')],
  outfile: path.join(output, 'native-bridge.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome60'],
  minify: true,
  sourcemap: false,
  legalComments: 'none'
});

console.log('Mobile web bundle ready in www/.');
