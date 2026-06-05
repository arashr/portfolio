# MD Portfolio — project memory

**Purpose:** Static portfolio fork of MD Gallery — case studies as bundled Markdown, homepage gallery from auto-built index.

**Sister:** `md-gallery` (drop-to-read reader). Share `lib/` poster stack and `assets/site.css`; do not merge repos.

## Layout

| Path | Role |
|------|------|
| `content/cases.index.json` | Auto-generated list of case study paths (`npm run build:content`) |
| `content/site.json` | Optional homepage hero title + tagline |
| `content/CONTENT.md` | Author guide (not a case study) |
| `content/*.md` | Case study source |
| `content/src/` | Images referenced as `src/…` from files in `content/` |
| `assets/portfolio.js` | Boot, content index load, reader chrome (no drop zone) |
| `lib/content-assets.js` | Relative image URL resolution |
| `lib/content-catalog.js` | Index paths + normalize (browser-safe) |
| `lib/content-index-node.js` | Scan `content/` for `.md`, write index (Node only) |
| `lib/portfolio-content.js` | Fetch index + resolve grid title/description |

## Images

Relative paths in markdown resolve against the **directory of the open `.md` file**:

- `content/foo.md` + `![](src/x.jpg)` → `/content/src/x.jpg`
- Per-project: `content/foo/src/x.jpg` + `![](src/x.jpg)` in `content/foo.md` → `/content/foo/src/x.jpg`

Use `npm start` (same origin). Remote images work; PDF export may omit CORS-blocked URLs (same as gallery).

## Adding a case study

1. Add `content/my-case.md` (optional YAML `description:` for the grid subtitle)
2. Add images under `content/src/` or next to the file
3. `npm start` — live index + auto-refresh in the browser; `npm run build:content` before static deploy

Hide drafts: prefix the filename with `.` (e.g. `content/.draft.md`) or remove the file.

## Commands

```bash
npm install && npm start
npm test
```
