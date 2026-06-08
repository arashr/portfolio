/**
 * Parse `content/home-aside.md` — `##` sections with a title and description paragraph.
 *
 * @param {string} rawText
 * @returns {{ sections: { title: string, description: string }[] }}
 */
export function parseHomeAside(rawText) {
  const body = stripYamlFrontmatter(String(rawText || '')).trim();
  if (!body) return { sections: [] };

  /** @type {{ title: string, description: string }[]} */
  const sections = [];
  const chunks = body.split(/^##\s+(.+)$/m);

  for (let i = 1; i < chunks.length; i += 2) {
    const title = chunks[i].trim();
    const block = (chunks[i + 1] || '').trim();
    if (!title || !block) continue;

    const description = block
      .split(/\n{2,}/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n\n');

    if (description) sections.push({ title, description });
  }

  return { sections };
}

/** @param {string} text */
function stripYamlFrontmatter(text) {
  if (!text.startsWith('---')) return text;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return text;
  return text.slice(end + 4).replace(/^\s*\n/, '');
}
