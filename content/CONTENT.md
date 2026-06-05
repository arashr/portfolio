# Content guide

Case studies are **Markdown files** anywhere under `content/`. The homepage grid is built automatically from those files — you do not maintain a manifest list.

## Adding a case study

1. Add `content/my-project.md` (or a nested path like `content/2025/my-project.md`).
2. Put images in `content/src/` or next to the file; reference them with relative paths, e.g. `![](src/hero.png)`.
3. With `npm start`, the homepage updates automatically when you save (no manual index step). For static deploy, run `npm run build:content` once before publishing.

## Hiding a draft

- Prefix the filename with a dot, e.g. `content/.draft-case-study.md`, or
- Delete or move the file out of `content/`.

Dot-prefixed files are ignored when the index is built.

## Homepage grid title & description

The gallery reads each file once for listing metadata (the full poster gallery still uses the normal `#` / `##` rules).

| Field | Source (first match wins) |
|--------|---------------------------|
| **Title** | YAML `title:` · first `#` heading · filename |
| **Description** (subtitle under the title on the card) | YAML `description:` · `subtext:` · `tagline:` · first plain paragraph between `#` and the first `##` |

Recommended pattern:

```md
---
description: Design system · 2025
---

# Project name

One short sentence for the homepage card. Readers see the full intro in the case study hero.

## First section

…
```

The intro paragraph is optional if you set `description` in frontmatter. Headings (`###`), images, and lists before the first `##` are skipped when picking an automatic description.

## Poster sections

Inside the case study, split posters with `##` headings — same rules as MD Gallery (`docs/POSTER_LOGIC.md` in the gallery repo).

## Site name on the homepage

Edit `content/site.json` for the large hero title and tagline (not the per-case grid).
