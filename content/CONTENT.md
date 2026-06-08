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
| **Stats** (metric chips in a row) | First markdown table in the intro (before the first `##`): header row = labels, next row = values |
| **Credit** (footer line, e.g. role · year) | YAML `credit:` · or `role:` + `year:` |

Recommended pattern:

```md
---
title: Conversion Growth
description: One short sentence for the homepage card.
role: Lead Product Designer
year: 2023
---

# Project name (case study hero — can differ from card title)

| CTR Increase | Sessions tested | Brands |
|---:|---:|---:|
| 8% | +364K | 50+ |

Readers see the full intro in the case study hero.

## First section

…
```

The intro paragraph is optional if you set `description` in frontmatter. Headings (`###`), images, and lists before the first `##` are skipped when picking an automatic description.

You can still prefix a description with a year (`2024 . …`); it is stripped from the card text and used as `year` when `year:` is not set in frontmatter.

## Poster sections

Inside the case study, split posters with `##` headings — same rules as MD Gallery (`docs/POSTER_LOGIC.md` in the gallery repo).

## Image layout flags

Use the optional **title** on an image (the quoted string in markdown) to opt into layout treatments:

```md
![Menu screenshot](src/menu.png "isometric")
```

| Title flag | Effect |
|------------|--------|
| `isometric` or `iso` | 3D isometric skew with solid black shadow and 1px border |

Tweak the skew and shadow in `config/gallery.config.json` under `theme.graphics.imageIsometric`.

You can combine a flag with a real tooltip title using commas: `"isometric, Settings dropdown"`.

## Site name on the homepage

Edit `content/site.json` for the large hero title and tagline (not the per-case grid).
