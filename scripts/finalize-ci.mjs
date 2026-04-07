/**
 * DAEHAN TRADE — Finalize CI
 *
 * Source: a-global-hub variant 3 (selected by user)
 *
 * Pipeline:
 *   1. Copy transparent a-3 → public/ci/final/logo-dark.png  (navy/gold, for light bgs)
 *   2. Upload opaque a-3 → uguu.se (public URL kie.ai backend can fetch)
 *   3. seedream/5-lite-image-to-image: recolor navy → white, keep gold
 *   4. recraft/remove-background → transparent PNG
 *   5. Save to public/ci/final/logo-light.png  (for dark bgs)
 *
 * Usage:
 *   node scripts/finalize-ci.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// --- Load .env.local ---
const envPath = path.join(PROJECT_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const KIE_API_KEY = process.env.KIE_API_KEY;
if (!KIE_API_KEY) {
  console.error('❌ KIE_API_KEY missing. Add it to .env.local');
  process.exit(1);
}

const API_BASE = 'https://api.kie.ai/api/v1';

// --- Paths ---
const SRC_OPAQUE = path.join(PROJECT_ROOT, 'public/ci/concepts/a-global-hub/3.png');
const SRC_TRANSPARENT = path.join(PROJECT_ROOT, 'public/ci/transparent/a-global-hub/3.png');
const FINAL_DIR = path.join(PROJECT_ROOT, 'public/ci/final');
const OUT_DARK = path.join(FINAL_DIR, 'logo-dark.png');
const OUT_LIGHT = path.join(FINAL_DIR, 'logo-light.png');
const OUT_RECOLORED_OPAQUE = path.join(FINAL_DIR, 'logo-light-source.png'); // intermediate

// --- Helpers ---
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

async function createKieTask(model, input) {
  const res = await fetch(`${API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, input }),
  });
  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(`createTask(${model}): code=${data.code} msg=${data.msg}`);
  }
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
      if (!url) throw new Error(`no result url for ${label}`);
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

// --- Main ---
async function main() {
  console.log('🚀 Finalizing CI from a-global-hub#3\n');

  // Verify sources
  for (const p of [SRC_OPAQUE, SRC_TRANSPARENT]) {
    if (!fs.existsSync(p)) {
      throw new Error(`source missing: ${p}`);
    }
  }
  fs.mkdirSync(FINAL_DIR, { recursive: true });

  // Step 1: dark version (= existing transparent a-3)
  fs.copyFileSync(SRC_TRANSPARENT, OUT_DARK);
  console.log(`💾 [dark] saved → ${path.relative(PROJECT_ROOT, OUT_DARK)}  (navy/gold for light bgs)`);

  // Step 2: upload opaque source
  console.log('📤 [light] uploading source to uguu.se...');
  const sourceUrl = await uploadToUguu(SRC_OPAQUE, 'a3-source');
  console.log(`✅ [light] uploaded → ${sourceUrl}`);

  // Step 3: recolor via seedream image-to-image
  console.log('🎨 [light] recoloring via seedream...');
  const recolorPrompt =
    "Recolor this corporate globe logo so it stands out on a dark background. " +
    "Change every dark navy blue element — the globe longitude/latitude lines, the connecting network strokes, " +
    "and the 'DAEHAN TRADE' wordmark text — to pure white (#FFFFFF). " +
    "Keep every gold element — the central 'DT' monogram letters and the small connection dot nodes — " +
    "exactly the same gold color (#C9A961). " +
    "Preserve the exact shape, composition, proportions, and details. " +
    "Output the same logo, only with recolored elements. " +
    "Place it on a solid pure black background. No other changes.";

  const recolorTaskId = await createKieTask('seedream/5-lite-image-to-image', {
    image_urls: [sourceUrl],
    prompt: recolorPrompt,
    aspect_ratio: '1:1',
    quality: 'high',
  });
  console.log(`✅ [light] recolor task=${recolorTaskId}`);

  const recoloredUrl = await waitForTask(recolorTaskId, 'recolor');
  console.log(`✅ [light] recolored → ${recoloredUrl}`);
  await downloadImage(recoloredUrl, OUT_RECOLORED_OPAQUE);
  console.log(`💾 [light] intermediate saved → ${path.relative(PROJECT_ROOT, OUT_RECOLORED_OPAQUE)}`);

  // Step 4: remove background from recolored result
  console.log('✂️  [light] removing background...');
  const bgRemoveTaskId = await createKieTask('recraft/remove-background', {
    image: recoloredUrl,
  });
  console.log(`✅ [light] bg-remove task=${bgRemoveTaskId}`);

  const transparentUrl = await waitForTask(bgRemoveTaskId, 'bg-remove');
  console.log(`✅ [light] transparent → ${transparentUrl}`);
  await downloadImage(transparentUrl, OUT_LIGHT);
  console.log(`💾 [light] saved → ${path.relative(PROJECT_ROOT, OUT_LIGHT)}  (white/gold for dark bgs)`);

  console.log('\n📊 Done.');
  console.log(`   logo-dark.png  → ${path.relative(PROJECT_ROOT, OUT_DARK)}`);
  console.log(`   logo-light.png → ${path.relative(PROJECT_ROOT, OUT_LIGHT)}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
