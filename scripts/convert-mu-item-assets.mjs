import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)(
  process.env.SHARP_MODULE ?? path.resolve('.tmp-image-tools/node_modules/sharp'),
);
const clientData = process.argv[2] ?? 'D:/IA/MU ONLINE/cliente instaler/CLIENTE NOVO/Data';
const outputDir = process.argv[3] ?? 'public/images/items';

const files = [];
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(ozj|ozt)$/i.test(entry.name)) files.push(full);
  }
}
await walk(clientData);

const byStem = new Map();
for (const file of files) {
  const stem = path.basename(file, path.extname(file)).toLowerCase();
  if (!byStem.has(stem)) byStem.set(stem, file);
}

const modelText = await fs.readFile(path.join(clientData, 'item_model.txt'), 'utf8');
await fs.mkdir(outputDir, { recursive: true });
const generated = [];

for (const line of modelText.split(/\r?\n/)) {
  const match = line.match(/^\s*\d+\s+(\d+)\s+(\d+).*?"([^"]+)"/);
  if (!match) continue;
  const [, group, index, model] = match;
  const source = byStem.get(model.toLowerCase());
  if (!source) continue;

  const raw = await fs.readFile(source);
  // Reproduz o MuTexConv open source: OZJ tem 24 bytes e OZT 4 bytes de cabeçalho.
  const offset = path.extname(source).toLowerCase() === '.ozj' ? 24 : 4;
  const decoded = raw.subarray(offset);
  const target = path.join(outputDir, `${group}_${index}.webp`);
  try {
    await sharp(decoded).webp({ quality: 90 }).toFile(target);
    generated.push({ group: Number(group), index: Number(index), model, source: path.relative(clientData, source).replaceAll('\\', '/') });
  } catch (error) {
    console.warn(`Falha em ${source}: ${error.message}`);
  }
}

await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({ format: 'webp', source: 'item_model.txt + OZJ/OZT', generated }, null, 2));
console.log(`Assets WebP gerados: ${generated.length}`);
