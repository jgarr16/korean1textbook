# Korean 1 Textbook Audio Player — Session Notes

## What This Is

A static GitHub Pages site that turns the *Integrated Korean: Beginning 1* (3rd edition)
textbook audio into an interactive study tool. Each lesson section displays the Korean
text line-by-line with per-line play buttons, per-speaker-turn play buttons, and a
play-all button. Designed for mobile use while studying.

**Live URL:** `https://jgarr16.github.io/korean1textbook/`  
**Repo:** `https://github.com/jgarr16/korean1textbook`  
**Local repo:** `/Users/jrgarrigues/repo/korean1/`

---

## Repo Structure

```
korean1/
  index.html          ← the entire app (single self-contained file)
  audio/
    Textbook_Lesson1_C1_3rd_Edition/
      lesson.pdf      ← source PDF (used to extract speaker assignments)
      README.md       ← segment filename → transcription map
      segment_06.mp3
      segment_07.mp3
      ...
    Textbook_Lesson1_C2_3rd_Edition/
    Textbook_Lesson1_N_3rd_Edition/
    ... (21 directories total: Lessons 1–7 × C1, C2, N)
```

The audio files live in the repo and are served directly by GitHub Pages.
There are **no external dependencies** — the app is pure HTML/CSS/JS.

---

## App Architecture

Everything is in `index.html`. Key sections:

| Section | What it does |
|---|---|
| Early-load `<script>` | Restores font scale + theme from `localStorage` before paint (prevents flash) |
| `<style>` | CSS with `--font-scale` and full light/dark theme via CSS custom properties |
| `const LESSONS` | All lesson/section/line data embedded as a JS array (no fetch needed) |
| `const COLORS` | Speaker → hex color map |
| Audio engine | `playFiles(paths)` → sequential playback with 400ms gap between segments |
| `const REG` | Registry that maps button IDs to audio path arrays (avoids JSON-in-onclick bugs) |
| `render()` | Rebuilds the full app UI; called on lesson/section switch |
| `controlsInit()` | Re-wires font (A− A A+) and theme (Light/System/Dark) buttons after each render |

---

## Data Structure

```javascript
LESSONS = [
  {
    title: "Lesson 1: Greetings",
    sections: [
      {
        label: "Conversation 1",
        title: "저는 스티브 윌슨이에요",
        dir: "Textbook_Lesson1_C1_3rd_Edition",   // audio subdirectory
        lines: [
          { speaker: "스티브", file: "segment_06.mp3", text: "안녕하세요" },
          ...
        ]
      },
      // Conversation 2, Narration...
    ]
  },
  // Lessons 2–7...
]
```

Speaker assignments were extracted by rendering each `lesson.pdf` to PNG
and reading the conversation visually. The README.md in each audio directory
maps filenames to transcriptions (no speaker column — that's encoded in LESSONS).

---

## Recurring Characters

| Korean | English | Color |
|---|---|---|
| 스티브 | Steve Wilson | Blue |
| 유미 | Kim Yumi | Green |
| 마이클 | Michael Jung | Amber |
| 소피아 | Sofia Wang | Purple |
| 리사 | Lisa | Cyan |
| 제니 | Jenny | Rose |
| 나레이터 | Narrator | Gray |

---

## Features Implemented

- Lesson tabs (1–7) with sub-tabs (Conversation 1 / Conversation 2 / Narration)
- Speaker-grouped lines with color-coded name + dot
- **▶** button per line (plays that segment)
- **▶ Play Turn** button per speaker block (plays all consecutive lines for that speaker)
- **▶ Play All** button at bottom of each section (plays full section in sequence)
- **Aa dropdown** (top-right of nav):
  - Font size: A− / A (reset) / A+ — persists via `localStorage`
  - Theme: Light / System / Dark — persists via `localStorage`
- Mobile-friendly (horizontal scroll on nav, touch targets ≥ 38px)

---

## Known Issues / Watch Points

- Audio won't play from `file://` locally — normal browser security restriction.
  Always test via GitHub Pages or a local server (`python3 -m http.server`).
- `render()` rebuilds the full DOM on every tab switch, which re-creates the
  `<details>` dropdown and calls `controlsInit()` to re-wire its buttons. If the
  dropdown ever stops working after a tab switch, check `controlsInit()` wiring.
- A few narration segments have unusual transcriptions (e.g., L7N segment_04 = "iki").
  These are artifacts of the original audio segmentation — the audio is correct.

---

## Possible Next Steps

- **Workbook audio** — the iCloud folder at
  `/Users/jrgarrigues/Library/Mobile Documents/com~apple~CloudDocs/Korean-1/Beginning_1_audio_3rd/Beg1_Workbook/`
  has workbook MP3s (Lessons 1–7) not yet in the site. Would need the same
  PDF-extraction + README workflow to map speakers/segments.
- **Romanization** — add a toggle to show/hide romanized pronunciation under each line.
- **Repeat mode** — loop a single line or a speaker's turn N times for drilling.
- **Progress tracking** — mark lines/sections as reviewed, stored in `localStorage`.
- **PWA / offline** — add a service worker + manifest so it installs on phone home screen
  and works without signal.

---

## How to Resume Work

1. Open Claude Code in `/Users/jrgarrigues/repo/korean1/`
2. Tell Claude: "pick up where we left off on the Korean1 textbook site" and point to this file.
3. All 21 lesson PDFs are already rendered as PNGs in `/tmp/pdf_*.png` (session-cached —
   re-run the pdftoppm commands if `/tmp` was cleared).
4. Push workflow: edit `index.html` → test locally (`open index.html` — layout only, no audio)
   → `git add index.html && git commit && git push origin main`
