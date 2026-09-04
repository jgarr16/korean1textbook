// Robust test capability for #1 perf + #2 selected parts + #3 minimal + #4 learning controls + data sanity.
// Run with: node --test tests/perf-check.mjs
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

test('#2 remember place: persists lesson section and offers resume', () => {
  assert.ok(html.includes('koreanLastPlace'), 'place key required');
  assert.ok(html.includes('function savePlace'), 'savePlace required');
  assert.ok(html.includes('function loadPlace'), 'loadPlace required');
  assert.ok(html.includes('function resumeSaved'), 'resumeSaved required');
  assert.ok(html.includes('resume-bar'), 'resume bar UI required');
  assert.ok(html.includes('Last time: Lesson'), 'resume bar text required');
});

test('#2 repeat and shuffle removed, no whole-lesson autoplay', () => {
  assert.ok(!html.includes('id="repeat-btn"'), 'repeat button must be removed');
  assert.ok(!html.includes('id="shuffle-btn"'), 'shuffle button must be removed');
  assert.ok(!html.includes('function toggleRepeat'), 'toggleRepeat must be removed');
  assert.ok(!html.includes('function toggleShuffle'), 'toggleShuffle must be removed');
  assert.ok(!html.includes('function shuffledEntriesFor'), 'shuffledEntriesFor must be removed');
  assert.ok(!html.includes('Play Lesson'), 'must not add whole-lesson autoplay');
});

test('speed limited to 0.75x, 1x, 1.25x', () => {
  assert.ok(html.includes('const SPEED_RATES = [0.75, 1, 1.25]'), 'SPEED_RATES must be limited');
  assert.ok(html.includes('data-rate="0.75"'), '0.75x required');
  assert.ok(html.includes('data-rate="1"'), '1x required');
  assert.ok(html.includes('data-rate="1.25"'), '1.25x required');
  assert.ok(!html.includes('data-rate="0.5"'), '0.5x must be removed');
  assert.ok(!html.includes('data-rate="1.5"'), '1.5x must be removed');
});

test('#3 minimal: sticky lesson bar only, expandable search icon, invisible deep-links', () => {
  assert.ok(html.includes('.nav-wrapper { display: flex; align-items: center; background: #1e293b; position: sticky; top: 0;'), 'lesson bar must be sticky');
  assert.ok(html.includes('id="search-bar"'), 'search bar required');
  assert.ok(html.includes('id="search-input"'), 'search input required');
  assert.ok(html.includes('function toggleSearch'), 'toggleSearch required');
  assert.ok(html.includes('function doSearch'), 'doSearch required');
  assert.ok(html.includes('function jumpToResult'), 'jumpToResult required');
  assert.ok(html.includes('function parseHash'), 'parseHash required');
  assert.ok(html.includes('function updateHash'), 'updateHash required');
  assert.ok(html.includes('#/lesson'), 'deep-link format required');
  assert.ok(html.includes('id="copy-link"'), 'copy link inside existing menu required');
  assert.ok(!html.includes('sticky-search'), 'must not add second sticky bar');
});

test('compact lesson nav uses Lesson prefix plus numbered buttons', () => {
  assert.ok(html.includes('lesson-prefix'), 'lesson prefix class required');
  assert.ok(html.includes('>Lesson</span>'), 'Lesson prefix label required');
  assert.ok(!html.includes('>Lesson 1</button>'), 'old redundant Lesson 1 button must be removed');
  assert.ok(html.includes('onclick="setLesson'), 'lesson buttons required');
});

test('#4 learning controls: Loop Line repeat and keyboard shortcuts, no +/-10s buttons', () => {
  assert.ok(html.includes('function toggleAB'), 'toggleAB required');
  assert.ok(html.includes('function syncABBtn'), 'syncABBtn required');
  assert.ok(html.includes('id="ab-btn"'), 'Loop Line button required');
  assert.ok(html.includes('Loop Line'), 'Loop Line label required');
  assert.ok(!html.includes('A-B Off'), 'old A-B label must be removed');
  assert.ok(!html.includes('id="back-btn"'), 'back 10s button must be removed');
  assert.ok(!html.includes('id="fwd-btn"'), 'forward 10s button must be removed');
  assert.ok(html.includes('abLoop'), 'abLoop state required');
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
