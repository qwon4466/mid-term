// Download only selected, openly licensed photographs; retain attribution.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const selected = [
  ['starbucks', 'File:Starbucks in Insadong, Seoul.jpg'],
  ['hospital', 'File:W병원 전경.jpg'],
  ['bus', 'File:서울버스정류장.jpg'],
  ['taxi', 'File:센트럴 앞 택시정류장.jpg']
];
const directory = path.join(root, 'assets/ax/photos');
await mkdir(directory, { recursive: true });
await mkdir(path.join(root, 'data'), { recursive: true });
const manifest = [];
for (const [id, title] of selected) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.search = new URLSearchParams({ action: 'query', format: 'json', titles: title,
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1600' });
  const response = await fetch(api, { headers: { 'User-Agent': 'SignBySign/0.1 educational prototype' } });
  if (!response.ok) throw new Error(`Metadata request failed: ${response.status}`);
  const json = await response.json();
  const info = Object.values(json.query.pages)[0]?.imageinfo?.[0];
  if (!info) throw new Error(`Missing image: ${title}`);
  const metadata = info.extmetadata;
  const license = metadata.LicenseShortName?.value;
  if (!/^(CC BY|CC0|Public domain)/.test(license || '')) throw new Error(`Review license: ${title}`);
  const url = new URL(info.thumburl || info.url);
  url.search = '';
  const image = await fetch(url, { headers: { 'User-Agent': 'SignBySign/0.1 educational prototype' } });
  if (!image.ok || !image.headers.get('content-type')?.startsWith('image/')) throw new Error(`Image request failed: ${title} (${image.status})`);
  const localPath = `assets/ax/photos/${id}.jpg`;
  await writeFile(path.join(root, localPath), Buffer.from(await image.arrayBuffer()));
  const clean = value => (value || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
  manifest.push({ id, path: localPath, title, kind: 'photo', sourceUrl: info.descriptionurl,
    downloadUrl: url.href, author: clean(metadata.Artist?.value), license,
    licenseUrl: metadata.LicenseUrl?.value || '', changes: 'Unedited Wikimedia thumbnail; displayed with CSS object-fit.',
    retrievedAt: new Date().toISOString().slice(0, 10) });
  console.log(`Imported ${id}: ${license}`);
}
await writeFile(path.join(root, 'data/photo-sources.json'), JSON.stringify(manifest, null, 2) + '\n');
