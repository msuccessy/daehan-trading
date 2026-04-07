/**
 * DAEHAN TRADE — Symbol-only logo generator
 *
 * Takes the full a-3 opaque source PNGs and uses kie.ai seedream image-to-image
 * to produce wordmark-free, tightly cropped symbol-only versions, then runs
 * recraft/remove-background. Outputs:
 *   public/ci/final/logo-symbol-dark.png   (navy/gold for light backgrounds)
 *   public/ci/final/logo-symbol-light.png  (white/gold for dark backgrounds)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load .env.local
const envPath = path.join(PROJECT_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const KIE_API_KEY = process.env.KIE_API_KEY;
if (!KIE_API_KEY) {
  console.error('❌ KIE_API_KEY missing');
  process.exit(1);
}

const API_BASE = 'https://api.kie.ai/api/v1';

// Two source files: original navy/gold opaque and recolored white/gold opaque
const VARIANTS = [
  {
    label: 'dark',
    source: 'public/ci/concepts/a-global-hub/3.png',
    bgColor: 'pure white (#FFFFFF)',
    out: 'public/ci/final/logo-symbol-dark.png',
  },
  {
    label: 'light',
    source: 'public/ci/final/logo-light-source.png',
    bgColor: 'solid pure black (#000000)',
    out: 'public/ci/final/logo-symbol-light.png',
  },
];

const SYMBOL_PROMPT = (bgColor) =>
  `Take the corporate logo in this image and produce a symbol-only version. ` +
  `Completely remove the 'DAEHAN TRADE' wordmark text that appears below the globe — ` +
  `the result must show ONLY the globe with the central 'DT' monogram and the connection node dots. ` +
  `Tightly center-crop on the globe symbol so it nearly fills the frame with comfortable padding (~5%). ` +
  `Keep all colors, shapes, lines, and proportions of the globe and DT monogram exactly as they are. ` +
  `Square 1:1 aspect ratio. Place on a ${bgColor} background. ` +
  `Do not add any text, do not redraw the symbol, do not change colors. Output the same exact symbol, just cropped and with the wordmark removed.`;

async function uploadToUguu(filePath, label) {
  const buf = fs.readFileSync(filePath);
  const blob = new Blob([buf], { type: 'image/png' });
  const filename = `${label.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.png`;
  const fd = new FormData();
  fd.append('files[]', blob, filename);
  const res = await fetch('https://uguu.se/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!data.success || !data.files?.[0]?.url) {
    throw new Error(`uguu upload failed: ${JSON.stringify(data)}`);
  }
  return data.files[0].url;
}

async function createTask(model, input) {
  const res = await fetch(`${API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KIE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input }),
  });
  const data = await res.json();
  if (data.code !== 200) throw new Error(`createTask(${model}): ${data.msg}`);
  return data.data.taskId;
}

async function waitForTask(taskId, label) {
  for (let i = 0; i < 90; i++) {
    const res = await fetch(`${API_BASE}/jobs/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${KIE_API_KEY}` },
    });
    const r = await res.json();
    if (r.code !== 200) throw new Error(`recordInfo(${label}): ${r.msg}`);
    const state = r.data?.state;
    if (state === 'success' || state === 'completed') {
      const parsed = JSON.parse(r.data.resultJson || '{}');
      const url = parsed.resultUrls?.[0] || parsed.image_url || parsed.url;
      if (!url) throw new Error(`no url for ${label}`);
      return url;
    }
    if (state === 'fail' || state === 'failed') {
      throw new Error(`task ${label} failed: ${r.data.failMsg || 'unknown'}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`task ${label} timed out`);
}

async function downloadImage(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.statusText}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function processVariant(variant) {
  const label = `symbol-${variant.label}`;
  try {
    const sourcePath = path.join(PROJECT_ROOT, variant.source);
    if (!fs.existsSync(sourcePath)) throw new Error(`source missing: ${sourcePath}`);

    console.log(`📤 [${label}] uploading source...`);
    const sourceUrl = await uploadToUguu(sourcePath, label);
    console.log(`✅ [${label}] uploaded → ${sourceUrl}`);

    console.log(`🎨 [${label}] removing wordmark via seedream...`);
    const editTaskId = await createTask('seedream/5-lite-image-to-image', {
      image_urls: [sourceUrl],
      prompt: SYMBOL_PROMPT(variant.bgColor),
      aspect_ratio: '1:1',
      quality: 'high',
    });
    const editedUrl = await waitForTask(editTaskId, `${label}-edit`);
    console.log(`✅ [${label}] edited → ${editedUrl}`);

    console.log(`✂️  [${label}] removing background...`);
    const bgTaskId = await createTask('recraft/remove-background', { image: editedUrl });
    const transparentUrl = await waitForTask(bgTaskId, `${label}-bgrm`);
    console.log(`✅ [${label}] transparent → ${transparentUrl}`);

    const outPath = path.join(PROJECT_ROOT, variant.out);
    await downloadImage(transparentUrl, outPath);
    console.log(`💾 [${label}] saved → ${variant.out}`);
    return { ok: true, label };
  } catch (err) {
    console.error(`❌ [${label}] ${err.message}`);
    return { ok: false, label, error: err.message };
  }
}

async function main() {
  console.log('🚀 Generating symbol-only logos\n');
  const results = await Promise.all(VARIANTS.map(processVariant));
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n📊 Done. success=${ok} fail=${results.length - ok}`);
  if (ok < results.length) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
