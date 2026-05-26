/**
 * Пакетное геокодирование mock-каталога (places / restaurants) по адресам из mockItemAddresses.ts.
 *
 * Использование:
 *   node scripts/geocode-batch.mjs
 *   node scripts/geocode-batch.mjs --dry-run
 *
 * Ключ: VITE_YANDEX_GEOCODER_API_KEY в .env.local или .env (см. .env.example).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const EKATERINBURG_BBOX = [
  [56.7, 60.35],
  [56.98, 60.85],
];
const MAP_CATEGORIES = new Set(['places', 'restaurants']);
const DELAY_MS = 250;

const CATALOG_FILES = [
  path.join(ROOT, 'src/data/mockDataCore.ts'),
  path.join(ROOT, 'src/data/mockCatalogEkbExtra.ts'),
];
const ADDRESSES_FILE = path.join(ROOT, 'src/data/mockItemAddresses.ts');

const dryRun = process.argv.includes('--dry-run');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function getApiKey() {
  return (
    process.env.VITE_YANDEX_GEOCODER_API_KEY?.trim() ||
    process.env.VITE_YANDEX_MAPS_API_KEY?.trim() ||
    ''
  );
}

function bboxParam() {
  const [[south, west], [north, east]] = EKATERINBURG_BBOX;
  return `${west},${south}~${east},${north}`;
}

function inBbox(lat, lng) {
  const [[south, west], [north, east]] = EKATERINBURG_BBOX;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

function roundCoord(n) {
  return Math.round(n * 1e6) / 1e6;
}

function parseAddresses(ts) {
  const map = new Map();
  const re = /'(\d+)':\s*\{\s*location:\s*'([^']*(?:\\'[^']*)*)'/g;
  let m;
  while ((m = re.exec(ts)) !== null) {
    map.set(m[1], m[2].replace(/\\'/g, "'"));
  }
  return map;
}

function parseCatalogItems(ts) {
  const items = [];
  const blocks = ts.split(/\n  \{/);
  for (const block of blocks) {
    const idM = block.match(/id:\s*'(\d+)'/);
    const catM = block.match(/category:\s*'(places|restaurants|excursions)'/);
    if (!idM || !catM) continue;
    items.push({ id: idM[1], category: catM[1] });
  }
  return items;
}

function geocodeQuery(location) {
  const q = location.trim();
  return q.includes('Екатеринбург') ? q : `Екатеринбург, ${q}`;
}

async function geocodeAddress(apikey, location) {
  const params = new URLSearchParams({
    apikey,
    geocode: geocodeQuery(location),
    format: 'json',
    lang: 'ru_RU',
    results: '1',
    bbox: bboxParam(),
    rspn: '1',
  });
  const url = `https://geocode-maps.yandex.ru/v1/?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ''}`);
  }
  const data = await res.json();
  const pos = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos;
  if (!pos) throw new Error('Адрес не найден');
  const [lng, lat] = pos.trim().split(/\s+/).map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Некорректные координаты в ответе');
  }
  if (!inBbox(lat, lng)) throw new Error(`Вне bbox: ${lat}, ${lng}`);
  return { lat: roundCoord(lat), lng: roundCoord(lng) };
}

function replaceCoordsInFile(content, id, lat, lng) {
  const marker = `id: '${id}'`;
  const idx = content.indexOf(marker);
  if (idx === -1) return null;
  const rest = content.slice(idx + marker.length);
  const nextMatch = rest.match(/\n    id: '/);
  const blockLen = nextMatch ? marker.length + nextMatch.index : rest.length + marker.length;
  const block = content.slice(idx, idx + blockLen);
  const updated = block.replace(
    /(\n    lat: )[\d.]+(,\n    lng: )[\d.]+/,
    `$1${lat}$2${lng}`,
  );
  if (updated === block) return null;
  return content.slice(0, idx) + updated + content.slice(idx + blockLen);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  loadEnvFile(path.join(ROOT, '.env.local'));
  loadEnvFile(path.join(ROOT, '.env'));
  if (!getApiKey()) loadEnvFile(path.join(ROOT, '.env.example'));

  const apikey = getApiKey();
  if (!apikey) {
    console.error('Задайте VITE_YANDEX_GEOCODER_API_KEY в .env.local или .env');
    process.exit(1);
  }

  const addresses = parseAddresses(fs.readFileSync(ADDRESSES_FILE, 'utf8'));
  const catalogById = new Map();

  for (const file of CATALOG_FILES) {
    const items = parseCatalogItems(fs.readFileSync(file, 'utf8'));
    for (const item of items) {
      catalogById.set(item.id, { ...item, file });
    }
  }

  const targets = [];
  for (const [id, meta] of catalogById) {
    if (!MAP_CATEGORIES.has(meta.category)) continue;
    const location = addresses.get(id);
    if (!location) {
      console.warn(`[skip] id=${id}: нет адреса в mockItemAddresses`);
      continue;
    }
    targets.push({ id, location, file: meta.file, category: meta.category });
  }

  targets.sort((a, b) => Number(a.id) - Number(b.id));
  console.log(`${dryRun ? '[dry-run] ' : ''}Геокодирование ${targets.length} объектов…\n`);

  const coordsById = new Map();
  const failed = [];

  for (const t of targets) {
    try {
      const coords = await geocodeAddress(apikey, t.location);
      coordsById.set(t.id, coords);
      console.log(`  ok  id=${t.id}  ${coords.lat}, ${coords.lng}  ← ${t.location}`);
    } catch (e) {
      failed.push({ id: t.id, location: t.location, error: e.message });
      console.warn(`  FAIL id=${t.id}  ${t.location}  (${e.message})`);
    }
    await sleep(DELAY_MS);
  }

  if (!dryRun && coordsById.size > 0) {
    for (const file of CATALOG_FILES) {
      let content = fs.readFileSync(file, 'utf8');
      let changed = 0;
      for (const [id, coords] of coordsById) {
        const meta = catalogById.get(id);
        if (meta?.file !== file) continue;
        const next = replaceCoordsInFile(content, id, coords.lat, coords.lng);
        if (next) {
          content = next;
          changed++;
        }
      }
      if (changed > 0) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`\nОбновлён ${path.relative(ROOT, file)} (${changed} объектов)`);
      }
    }
  }

  console.log(`\nГотово: ${coordsById.size} координат, ошибок: ${failed.length}`);
  if (failed.length) {
    console.log('\nПроблемные id (координаты не изменены):');
    for (const f of failed) {
      console.log(`  ${f.id}: ${f.location} — ${f.error}`);
    }
  }

  if (dryRun) {
    console.log('\n(dry-run: файлы не записаны)');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
