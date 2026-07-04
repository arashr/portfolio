import { plainTextFromMarkdown } from './inline-markdown.js';

const H1 = /^#\s+(.+)$/;
const H2 = /^##\s+(.+)$/;
const H_ANY = /^(#{1,6})\s+(.+)$/;

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'section';
}

function parseYamlFrontmatter(text) {
  if (!text.startsWith('---\n')) return { meta: {}, body: text };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { meta: {}, body: text };
  const yaml = text.slice(4, end);
  const body = text.slice(end + 5);
  const meta = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) meta[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return { meta, body };
}

/** Track fenced code blocks so split markers inside code examples are ignored. */
function lineFlags(lines) {
  const flags = [];
  let fence = null;

  for (const line of lines) {
    const trimmed = line.trimStart();
    let inFence = Boolean(fence);

    if (!fence) {
      const open = trimmed.match(/^(`{3,}|~{3,})/);
      if (open) {
        const marker = open[1];
        fence = { char: marker[0], length: marker.length };
        inFence = true;
      }
    } else {
      const close = trimmed.match(/^(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) {
        fence = null;
      }
    }

    flags.push(inFence);
  }

  return flags;
}

function countSplitCandidates(lines, flags) {
  let h2 = 0;
  let hr = 0;
  for (let i = 0; i < lines.length; i++) {
    if (flags[i]) continue;
    if (H2.test(lines[i])) h2++;
    if (/^---\s*$/.test(lines[i].trim())) hr++;
  }
  return { h2, hr };
}

/** Drop trailing blank lines and `---` rules left before the next `##` split. */
function trimPosterLines(lines) {
  const out = [...lines];
  while (out.length > 0) {
    const t = out[out.length - 1].trim();
    if (t === '' || /^---\s*$/.test(t)) out.pop();
    else break;
  }
  return out;
}

function splitByH2(lines, flags) {
  const blocks = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (flags[i]) {
      if (current) current.lines.push(line);
      continue;
    }
    const m = line.match(H2);
    if (m) {
      if (current) {
        current.lines = trimPosterLines(current.lines);
        blocks.push(current);
      }
      current = { title: m[1].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) {
    current.lines = trimPosterLines(current.lines);
    blocks.push(current);
  }
  return blocks;
}

function splitByHr(lines, flags) {
  const chunks = [];
  let chunk = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!flags[i] && /^---\s*$/.test(line.trim()) && chunk.length) {
      chunks.push(chunk);
      chunk = [];
    } else {
      chunk.push(line);
    }
  }
  if (chunk.length) chunks.push(chunk);
  return chunks.map((chunkLines, idx) => {
    let title = `Section ${idx + 1}`;
    for (const l of chunkLines) {
      const h2 = l.match(H2);
      const h1 = l.match(H1);
      if (h2) {
        title = h2[1].trim();
        break;
      }
      if (h1) {
        title = h1[1].trim();
        break;
      }
    }
    return { title, lines: trimPosterLines(chunkLines) };
  });
}

function extractMeta(lines, filename) {
  let title = filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
  const introLines = [];
  let i = 0;

  while (i < lines.length && !lines[i].trim()) i++;
  if (lines[i]?.match(H1)) {
    title = lines[i].replace(/^#\s+/, '').trim();
    i += 1;
  }

  let splitAt = lines.length;
  const flags = lineFlags(lines);
  const { h2, hr } = countSplitCandidates(lines, flags);

  if (h2 > 0) {
    for (let j = i; j < lines.length; j++) {
      if (!flags[j] && H2.test(lines[j])) {
        splitAt = j;
        break;
      }
    }
  } else if (hr >= 2) {
    for (let j = i; j < lines.length; j++) {
      if (!flags[j] && /^---\s*$/.test(lines[j].trim())) {
        splitAt = j;
        break;
      }
    }
  } else {
    // No ## or --- splits: keep body for the single poster, not the hero intro.
    splitAt = i;
  }

  for (; i < splitAt; i++) {
    const line = lines[i];
    if (/^---\s*$/.test(line.trim())) continue;
    if (line.trim()) introLines.push(line);
    else if (introLines.length) introLines.push('');
  }

  return {
    title,
    introMarkdown: introLines.join('\n').trim(),
    bodyLines: lines.slice(splitAt),
    flags
  };
}

function uniqueSlug(base, used) {
  let slug = base || 'section';
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n++;
  }
  used.add(slug);
  return slug;
}

/** TOC: each poster (h2) plus h3–h6 inside poster bodies. IDs match render slug rules. */
export function buildToc(posters) {
  const used = new Set();
  const toc = [];
  for (const poster of posters) {
    toc.push({ depth: 2, text: poster.plainTitle || poster.title, id: poster.slug });
    used.add(poster.slug);
    const lines = poster.bodyMarkdown.split(/\r?\n/);
    const flags = lineFlags(lines);
    for (let i = 0; i < lines.length; i++) {
      if (flags[i]) continue;
      const m = lines[i].match(H_ANY);
      if (!m || m[1].length < 3) continue;
      const raw = m[2].trim();
      const text = plainTextFromMarkdown(raw);
      const id = uniqueSlug(slugify(text), used);
      toc.push({ depth: m[1].length, text, id });
    }
  }
  return toc;
}

/** Document title only (frontmatter, `#` heading, or filename) — for landing thumbnails. */
export function peekDocumentTitle(rawText, filename = 'document.md') {
  const { meta, body } = parseYamlFrontmatter(rawText);
  const lines = body.split(/\r?\n/);
  const { title } = extractMeta(lines, filename);
  return meta.title || title;
}

/** First plain paragraph between `#` and the first `##` (skips headings, images, lists). */
function introBlurbForListing(introMarkdown) {
  const intro = introMarkdown?.trim();
  if (!intro) return '';

  const lines = intro.split(/\r?\n/);
  const flags = lineFlags(lines);
  /** @type {string[]} */
  const parts = [];

  for (let i = 0; i < lines.length; i++) {
    if (flags[i]) continue;
    const t = lines[i].trim();
    if (!t) {
      if (parts.length) break;
      continue;
    }
    if (/^#{1,6}\s/.test(t)) continue;
    if (/^!\[/.test(t)) continue;
    if (/^[-*+]\s/.test(t)) continue;
    if (/^\d+\.\s/.test(t)) continue;
    if (/^\|/.test(t)) continue;
    if (/^---\s*$/.test(t)) continue;

    parts.push(t);
    for (let j = i + 1; j < lines.length; j++) {
      if (flags[j]) {
        parts.push(lines[j]);
        continue;
      }
      const next = lines[j].trim();
      if (!next) break;
      if (/^#{1,6}\s/.test(next)) break;
      if (/^!\[/.test(next)) break;
      if (/^[-*+]\s/.test(next)) break;
      parts.push(lines[j].trim());
    }
    break;
  }

  let plain = plainTextFromMarkdown(parts.join(' ')).replace(/\s+/g, ' ').trim();
  if (plain.length > 160) plain = `${plain.slice(0, 157)}…`;
  return plain;
}

/** Split `2024 . Description text` into year + body (legacy description pattern). */
function splitDescriptionYear(text) {
  const m = String(text).match(/^(\d{4})\s*\.\s*(.+)$/s);
  if (!m) return { year: '', subtext: String(text).trim() };
  return { year: m[1], subtext: m[2].trim() };
}

function isTableSeparatorRow(cells) {
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

function parseMarkdownTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

/** First intro pipe table with a header row + one data row → stat chips for the homepage card. */
function introStatsForListing(introMarkdown) {
  const intro = introMarkdown?.trim();
  if (!intro) return [];

  const lines = intro.split(/\r?\n/);
  const flags = lineFlags(lines);

  for (let i = 0; i < lines.length; i++) {
    if (flags[i] || !lines[i].trim().startsWith('|')) continue;

    /** @type {string[][]} */
    const rows = [];
    let j = i;
    while (j < lines.length && !flags[j] && lines[j].trim().startsWith('|')) {
      rows.push(parseMarkdownTableRow(lines[j]));
      j++;
    }

    const dataRows = rows.filter((cells) => cells.length && !isTableSeparatorRow(cells));
    if (dataRows.length < 2) continue;

    const [headers, values] = dataRows;
    if (headers.length !== values.length || headers.length < 2) continue;

    return headers
      .map((label, idx) => ({
        value: values[idx] || '',
        label: label || ''
      }))
      .filter((s) => s.value && s.label);
  }

  return [];
}

function listingCredit(meta) {
  if (meta.credit) return meta.credit.trim();
  const role = meta.role?.trim() || '';
  const year = meta.year?.trim() || '';
  if (role && year) return `${role} – ${year}`;
  return role || year || '';
}

/**
 * Title + grid subtitle for the homepage gallery.
 * Uses YAML `title` / `description` (or `subtext`, `tagline`) when present;
 * otherwise `#` heading + first intro paragraph before the first `##`.
 * Stats: first `| … |` table in the intro (before the first `##`).
 * Credit: YAML `credit` or `role` + `year`.
 */
export function peekCaseStudyListing(rawText, filename = 'document.md') {
  const { meta, body } = parseYamlFrontmatter(rawText);
  const lines = body.split(/\r?\n/);
  const { title, introMarkdown } = extractMeta(lines, filename);
  const listingTitle = meta.title || title;

  const fromMeta = meta.description || meta.subtext || meta.tagline;
  let subtext = fromMeta || introBlurbForListing(introMarkdown);
  let year = meta.year?.trim() || '';

  if (fromMeta && subtext) {
    const split = splitDescriptionYear(subtext);
    if (!year) year = split.year;
    subtext = split.subtext;
  }

  const stats = introStatsForListing(introMarkdown);
  const credit = listingCredit({ ...meta, year });

  return {
    title: listingTitle,
    subtext: subtext || '',
    stats,
    credit
  };
}

export function parseDocument(rawText, filename = 'document.md') {
  const { meta, body } = parseYamlFrontmatter(rawText);
  const lines = body.split(/\r?\n/);
  const flags = lineFlags(lines);
  let { title, introMarkdown, bodyLines } = extractMeta(lines, filename);
  const bodyFlags = lineFlags(bodyLines);
  const { h2, hr } = countSplitCandidates(bodyLines, bodyFlags);

  let rawBlocks = [];
  if (h2 > 0) {
    rawBlocks = splitByH2(bodyLines, bodyFlags);
  } else if (hr >= 2) {
    rawBlocks = splitByHr(bodyLines, bodyFlags);
  } else {
    const sectionTitle =
      bodyLines.find((l, i) => !bodyFlags[i] && H1.test(l))?.replace(/^#\s+/, '').trim() ||
      title;
    rawBlocks = [{ title: sectionTitle, lines: bodyLines }];
  }

  if (rawBlocks.length === 0) {
    rawBlocks = [{ title, lines: bodyLines }];
  }

  const usedSlugs = new Set();
  let posters = rawBlocks.map((block, index) => {
    const slug = uniqueSlug(slugify(plainTextFromMarkdown(block.title)), usedSlugs);
    const bodyMarkdown = block.lines.join('\n').trim();
    const plainTitle = plainTextFromMarkdown(block.title);
    return {
      index,
      title: block.title,
      plainTitle,
      slug,
      bodyMarkdown
    };
  });

  ({ introMarkdown, posters } = maybePromoteIntroToPoster(
    introMarkdown,
    posters,
    usedSlugs,
    meta.title || title
  ));

  const toc = buildToc(posters);

  return {
    title: meta.title || title,
    introMarkdown,
    posters,
    toc,
    splitMode: h2 > 0 ? 'h2' : hr >= 2 ? 'hr' : 'single'
  };
}

function stripLeadingHeadingFromIntro(intro, title) {
  const lines = intro.split(/\r?\n/);
  const m = lines[0]?.match(/^(#{1,6})\s+(.+)$/);
  if (!m) return intro;
  if (plainTextFromMarkdown(m[2].trim()) !== plainTextFromMarkdown(title)) return intro;
  let i = 1;
  while (i < lines.length && !lines[i].trim()) i++;
  return lines.slice(i).join('\n').trim() || intro;
}

/** Pre-## case header becomes the first poster (same split/render path as other sections). */
function maybePromoteIntroToPoster(introMarkdown, posters, usedSlugs, documentTitle) {
  const intro = introMarkdown?.trim();
  if (!intro) return { introMarkdown: intro, posters };

  const posterTitle = String(documentTitle || 'Overview').trim() || 'Overview';
  const plainTitle = plainTextFromMarkdown(posterTitle);
  const bodyMarkdown = stripLeadingHeadingFromIntro(intro, posterTitle);
  const introPoster = {
    index: 0,
    title: posterTitle,
    plainTitle,
    slug: uniqueSlug(slugify(plainTitle), usedSlugs),
    bodyMarkdown,
    isIntroPoster: true
  };

  const shifted = posters.map((p, i) => ({ ...p, index: i + 1 }));
  return { introMarkdown: '', posters: [introPoster, ...shifted] };
}
