/**
 * DAEHAN TRADE — CI Background Removal
 *
 * Pipeline:
 *   1. Read existing PNGs from public/ci/concepts/{concept}/
 *   2. Upload each to catbox.moe (public anonymous file host) → public URL
 *   3. POST that URL to kie.ai `recraft/remove-background` → transparent PNG
 *   4. Download to public/ci/transparent/{concept}/
 *
 * Usage:
 *   node scripts/remove-bg.mjs               # default: a-global-hub + d-premium-wordmark
 *   node scripts/remove-bg.mjs a-global-hub  # specific concept(s)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// --- Load .env.local ---
const envPath = path.join(PROJECT_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  for (const line of envText.split('\n')) {
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
const MODEL = 'recraft/remove-background';
const VARIANTS_PER_CONCEPT = 4;

const DEFAULT_CONCEPTS = ['a-global-hub', 'd-premium-wordmark'];
const concepts = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_CONCEPTS;

// --- uguu.se upload (anonymous, no auth, https direct link) ---
// Returns a public https URL on d.uguu.se that kie.ai's backend can fetch.
async function uploadToTempHost(filePath, label) {
  const buf = fs.readFileSync(filePath);
  const blob = new Blob([buf], { type: 'image/png' });
  // Unique filename so the host doesn't reject duplicates / generic names.
  const filename = `${label.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.png`;
  const fd = new FormData();
  fd.append('files[]', blob, filename);

  const res = await fetch('https://uguu.se/upload', {
    method: 'POST',
    body: fd,
  });
  const data = await res.json();
  if (!data.success || !data.files?.[0]?.url) {
    throw new Error(`uguu upload failed: ${JSON.stringify(data)}`);
  }
  return data.files[0].url;
}

// --- kie.ai background removal ---
async function createRemoveBgTask(imageUrl) {
  const res = await fetch(`${API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      input: { image: imageUrl },
    }),
  });
  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(`createTask: code=${data.code} msg=${data.msg}`);
  }
  return data.data.taskId;
}

async function waitForTask(taskId, label) {
  for (let i = 0; i < 90; i++) {
    const res = await fetch(`${API_BASE}/jobs/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${KIE_API_KEY}` },
    });
    const r = await res.json();
    if (r.code !== 200) throw new Error(`recordInfo error for ${label}: ${r.msg}`);
    const state = r.data?.state;
    if (state === 'success' || state === 'completed') {
      const parsed = JSON.parse(r.data.resultJson || '{}');
      const url = parsed.resultUrls?.[0] || parsed.image_url || parsed.url;
      if (!url) throw new Error(`no image URL for ${label}`);
      return url;
    }
    if (state === 'fail' || state === 'failed') {
      throw new Error(`task ${label} failed: ${r.data.failMsg || 'unknown'}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`task ${label} timed out`);
}

async function downloadImage(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buf);
}

// --- Pipeline per image ---
async function processOne(concept, variant) {
  const label = `${concept}#${variant}`;
  try {
    const inputPath = path.join(
      PROJECT_ROOT,
      'public',
      'ci',
      'concepts',
      concept,
      `${variant}.png`,
    );
    if (!fs.existsSync(inputPath)) {
      throw new Error(`source not found: ${inputPath}`);
    }

    console.log(`📤 [${label}] uploading to uguu.se...`);
    const publicUrl = await uploadToTempHost(inputPath, label);
    console.log(`✅ [${label}] uploaded → ${publicUrl}`);

    console.log(`✂️  [${label}] removing background...`);
    const taskId = await createRemoveBgTask(publicUrl);
    const transparentUrl = await waitForTask(taskId, label);
    console.log(`✅ [${label}] processed → ${transparentUrl}`);

    const outputPath = path.join(
      PROJECT_ROOT,
      'public',
      'ci',
      'transparent',
      concept,
      `${variant}.png`,
    );
    await downloadImage(transparentUrl, outputPath);
    console.log(`💾 [${label}] saved → ${path.relative(PROJECT_ROOT, outputPath)}`);
    return { ok: true, label };
  } catch (err) {
    console.error(`❌ [${label}] ${err.message}`);
    return { ok: false, label, error: err.message };
  }
}

async function main() {
  console.log(`🚀 Removing background for concepts: ${concepts.join(', ')}`);
  console.log(`   Variants per concept: ${VARIANTS_PER_CONCEPT}`);
  console.log(`   Total: ${concepts.length * VARIANTS_PER_CONCEPT}\n`);

  const jobs = [];
  for (const concept of concepts) {
    for (let v = 1; v <= VARIANTS_PER_CONCEPT; v++) {
      jobs.push(processOne(concept, v));
    }
  }

  const results = await Promise.all(jobs);
  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;

  console.log(`\n📊 Done. success=${ok}  fail=${fail}`);
  if (fail > 0) {
    console.log('\nFailed:');
    for (const r of results.filter((r) => !r.ok)) {
      console.log(`  - ${r.label}: ${r.error}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
