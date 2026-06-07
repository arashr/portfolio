# Agent instructions — MD Portfolio

Sister to **md-gallery** (same poster stack, no user file input).

1. **Content** → `.md` case studies under `content/`. Dev (`npm start`): live index + browser refresh. Deploy: `npm run build:content` → `content/cases.index.json`. Guide: `content/CONTENT.md`. Hero: `content/site.json`.
2. **Images** → `lib/content-assets.js` resolves relative `src` paths from each markdown file’s directory.
3. **App** → `assets/portfolio.js`, `index.html` (not `reader.js`).
4. **Visual config** → `config/gallery.config.json` + `lib/gallery-config.js` (same as gallery).
5. **Styles** → `assets/site.css`, `reader.css`, `portfolio.css` import modules under `assets/css/` (see `assets/css/README.md`).
6. **Poster split** → `lib/parse-document.js` + md-gallery `docs/POSTER_LOGIC.md` (behavior unchanged).

```bash
npm install
npm start
npm test
```
