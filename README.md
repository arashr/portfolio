# MD Portfolio

Sister project to [MD Gallery](https://github.com/arashr/md-gallery): a **static portfolio** where case studies are Markdown files rendered as the same editorial poster gallery — no file drop, no uploads.

## Content layout

```text
content/
  cases.index.json       # Generated for deploy (`npm run build:content`); live-built in dev
  site.json              # Homepage hero title + tagline (optional)
  CONTENT.md             # Format guide for authors
  example-case-study.md
  src/                   # Shared images (referenced as src/… from .md in content/)
    sample-visual.svg
```

Add a case study:

1. Create `content/my-project.md` (split sections with `##` headings).
2. Optional YAML at the top for the homepage card:

   ```yaml
   ---
   description: Role · year
   ---
   ```

   Or use the first plain paragraph between `#` and the first `##`. See `content/CONTENT.md`.

3. Put images in `content/src/` or beside the file; reference with relative paths: `![](src/hero.jpg)`.
4. Run `npm start` — saving files updates the gallery automatically in the browser.

Hide a draft: rename to `.my-draft.md` or delete the file.

## Quick start

```bash
cd md-portfolio
npm install
npm start
```

Open the URL from `serve` (usually `http://localhost:3000`). Use HTTP, not `file://`.

```bash
npm test
```

## Compared to MD Gallery

| | MD Gallery | MD Portfolio |
|---|------------|----------------|
| Input | User drops `.md` / folder | Pre-shipped `content/*.md` |
| Homepage | Drop zone + optional folder grid | Case study gallery from auto index |
| Images | Best with root-absolute paths | Relative paths resolved from each `.md` file |

Shared: parser, poster rendering, design config (`config/gallery.config.json`), TOC, zoom, PDF export, glyphs.

## Deploy

Any static host (GitHub Pages, Netlify, etc.): publish the repo root after `npm install` so `node_modules` is available for the import map. Run `npm run build:content` before deploy and commit `content/cases.index.json`. Use `npm run preview` to test that static build locally.

## License

MIT. See [LICENSE](LICENSE).
