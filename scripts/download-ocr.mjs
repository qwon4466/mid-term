import { mkdir, writeFile } from 'node:fs/promises';
const directory = new URL('../ocr-data/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const language of ['kor', 'eng']) {
  const url = `https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/${language}.traineddata`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download ${language}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 100000) throw new Error(`Invalid OCR data: ${language}`);
  await writeFile(new URL(`${language}.traineddata`, directory), buffer);
  console.log(`Downloaded ${language}: ${buffer.length} bytes (Apache-2.0)`);
}
