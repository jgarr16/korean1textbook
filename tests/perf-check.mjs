// Robust test capability for #1 perf + data sanity.
// Run with: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('no blocking gtag script, deferred to idle', () => {
  assert.ok(!html.includes('<script async src="https://www.googletagmanager.com/gtag/js'), 'gtag must not block head');
  assert.ok(html.includes('requestIdleCallback(load'), 'gtag must load on idle');
  assert.ok(html.includes('rel="preconnect"'), 'preconnect hint required');
});

test('single Audio element with preload none', () => {
  assert.ok(html.includes('new Audio()'), 'must reuse single Audio element');
  assert.ok(html.includes("preload = 'none'"), 'preload must be none');
  assert.ok(!html.match(/<audio[\s>]/i), 'must not use many <audio> tags');
});

test('happy medium: warm first clips then background rest, no blocking bulk fetch', () => {
  assert.ok(html.includes('warmSection(REG[allKey])'), 'render must warm section without blocking');
  assert.ok(html.includes('function warmSection'), 'warmSection required');
  assert.ok(html.includes('function fetchWithToken'), 'cancellable background fetch required');
  assert.ok(html.includes('function prefetchPath'), 'lookahead prefetch required for gapless Play All');
  assert.ok(html.includes('requestIdleCallback(runRest'), 'rest of section must fill in background idle');
  assert.ok(html.includes('shouldDeferPrefetch'), 'Save-Data respect required');
  assert.ok(html.includes('BLOB_MAX'), 'LRU cache limit required');
  assert.ok(html.includes('prefetchPath(playQueue[0].src)'), 'playNext must prefetch next clip');
});

test('lesson data intact: 7 lessons x 3 sections', () => {
  const lessons = (html.match(/title: "Lesson \d+:/g) || []).length;
  assert.equal(lessons, 7);
  assert.equal((html.match(/label: "Conversation 1"/g) || []).length, 7);
  assert.equal((html.match(/label: "Conversation 2"/g) || []).length, 7);
  assert.equal((html.match(/label: "Narration"/g) || []).length, 7);
});

test('every line has speaker, file, text, en', () => {
  const bad = [];
  const re = /\{\s*speaker:\s*"([^"]+)",\s*file:\s*"([^"]+)",\s*text:\s*"([^"]+)",\s*en:\s*"([^"]*)"\s*\}/g;
  let m; let count = 0;
  while ((m = re.exec(html))) { count++; if (!m[1] || !m[2] || !m[3]) bad.push(m[0]); }
  assert.ok(count > 200, `expected >200 lines, got ${count}`);
  assert.deepEqual(bad, []);
});
