/**
 * DAEHAN TRADE — CI Logo Generator
 *
 * Uses kie.ai Seedream 5.0 Lite (text-to-image) to generate 4 logo concepts
 * with 4 variations each (16 images total), in parallel.
 *
 * Usage:
 *   node scripts/generate-ci.mjs
 *
 * Requires KIE_API_KEY in .env.local (or environment).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// --- Load .env.local manually (no dotenv dep) ---
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
const MODEL = 'seedream/5-lite-text-to-image';
const VARIATIONS_PER_CONCEPT = 4;

// --- Concept definitions ---
const concepts = [
  {
    slug: 'a-global-hub',
    title: 'Global Hub Mark',
    prompt:
      "Minimalist corporate logo design for 'DAEHAN TRADE', a premium global B2B mobile device export company. " +
      "Stylized globe with subtle longitude lines, elegant DT monogram letterform in the center, " +
      "small connection dot nodes around it representing global trade network. " +
      "Color scheme: deep navy blue (#0A1F44) and gold (#C9A961). " +
      "Clean vector style, flat 2D logo, symmetric, scalable, on pure white background. " +
      "Professional, trustworthy, international trade aesthetic. " +
      "No realistic photo elements, no 3D rendering, no people, no text other than 'DAEHAN TRADE' if shown. " +
      "High-end corporate identity, single iconic mark.",
  },
  {
    slug: 'b-hangeul-gateway',
    title: 'Hangeul Gateway',
    prompt:
      "Minimalist corporate logo design for 'DAEHAN TRADE', a Korean-based premium trading company. " +
      "Abstract geometric interpretation of the Korean consonant 'ㄷ' (Dieut) shaped as a modern gateway or arch, " +
      "evoking heritage and entrance to global markets. Bold, confident, architectural. " +
      "Monochrome black on pure white background, with one subtle accent color stripe. " +
      "Clean vector style, flat 2D, symmetric, scalable. " +
      "Modern Korean brand identity, premium, minimal. " +
      "No realistic photo elements, no 3D rendering, no people, single iconic mark.",
  },
  {
    slug: 'c-circular-flow',
    title: 'Circular Flow',
    prompt:
      "Minimalist corporate logo design for 'DAEHAN TRADE', a global used mobile device trading and circular economy company. " +
      "Two stylized arrows forming a continuous circle representing import-export flow and device reuse, " +
      "with a small mobile phone silhouette or letter 'D' nested in the center. " +
      "Color scheme: emerald green (#0E7C5C) and charcoal gray (#2A2D34). " +
      "Sustainable, eco-conscious, trustworthy. Clean vector style, flat 2D, symmetric, scalable. " +
      "On pure white background. No realistic photo elements, no 3D rendering, single iconic mark.",
  },
  {
    slug: 'd-premium-wordmark',
    title: 'Premium Wordmark',
    prompt:
      "Minimalist premium wordmark logo for 'DAEHAN TRADE', a luxury international trading house. " +
      "Elegant custom serif-sans hybrid typography spelling out the words 'DAEHAN TRADE' in a single horizontal line, " +
      "with a small geometric symbol (diamond shape or thin slash) between the 'N' and 'T'. " +
      "Color: black text on pure white background, with a thin gold horizontal underline. " +
      "Heritage trading company aesthetic, classic and premium, evoking century-old trading houses. " +
      "Clean flat design, vector style, no 3D rendering, no realistic elements. " +
      "High-end corporate identity wordmark only.",
  },
];

// --- API helpers ---

async function createTask(prompt) {
  const res = await fetch(`${API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      input: {
        prompt,
        aspect_ratio: '1:1',
        quality: 'high',
      },
    }),
  });
  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(`createTask failed: code=${data.code} msg=${data.msg}`);
  }
  return data.data.taskId;
}

async function getTaskInfo(taskId) {
  const res = await fetch(`${API_BASE}/jobs/recordInfo?taskId=${taskId}`, {
    headers: { Authorization: `Bearer ${KIE_API_KEY}` },
  });
  return res.json();
}

async function waitForTask(taskId, label) {
  const maxAttempts = 90; // ~3 min
  for (let i = 0; i < maxAttempts; i++) {
    const r = await getTaskInfo(taskId);
    if (r.code !== 200) {
      throw new Error(`recordInfo error for ${label}: ${r.msg}`);
    }
    const state = r.data?.state;
    if (state === 'success' || state === 'completed') {
      const parsed = JSON.parse(r.data.resultJson || '{}');
      const url = parsed.resultUrls?.[0] || parsed.image_url || parsed.url;
      if (!url) throw new Error(`No image URL returned for ${label}`);
      return url;
    }
    if (state === 'fail' || state === 'failed') {
      throw new Error(`Task ${label} failed: ${r.data.failMsg || 'unknown'}`);
    }
    await new Promise((res) => setTimeout(res, 2000));
  }
  throw new Error(`Task ${label} timed out`);
}

async function downloadImage(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buf);
}

// --- Main ---

async function generateOne(concept, variant) {
  const label = `${concept.slug}#${variant}`;
  try {
    console.log(`🎨 [${label}] createTask...`);
    const taskId = await createTask(concept.prompt);
    console.log(`✅ [${label}] task=${taskId}`);
    const url = await waitForTask(taskId, label);
    const outPath = path.join(
      PROJECT_ROOT,
      'public',
      'ci',
      'concepts',
      concept.slug,
      `${variant}.png`,
    );
    await downloadImage(url, outPath);
    console.log(`💾 [${label}] saved → ${path.relative(PROJECT_ROOT, outPath)}`);
    return { ok: true, label, outPath };
  } catch (err) {
    console.error(`❌ [${label}] ${err.message}`);
    return { ok: false, label, error: err.message };
  }
}

async function main() {
  console.log(`🚀 Generating CI logos with model: ${MODEL}`);
  console.log(`   Concepts: ${concepts.length}, variations each: ${VARIATIONS_PER_CONCEPT}`);
  console.log(`   Total images: ${concepts.length * VARIATIONS_PER_CONCEPT}\n`);

  const jobs = [];
  for (const concept of concepts) {
    for (let v = 1; v <= VARIATIONS_PER_CONCEPT; v++) {
      jobs.push(generateOne(concept, v));
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
