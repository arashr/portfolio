/**
 * @param {{ sections: { title: string, description: string }[] }} aside
 */
export function renderHomeAside(aside) {
  if (!aside?.sections?.length) return '';

  const blocks = aside.sections
    .map(({ title, description }) => {
      const paras = description
        .split(/\n{2,}/)
        .map((p) => `<p class="landing-aside__desc">${escapeHtml(p)}</p>`)
        .join('');

      return `<section class="landing-aside__section">
        <h2 class="landing-aside__title">${escapeHtml(title)}</h2>
        ${paras}
      </section>`;
    })
    .join('\n');

  return `<div class="landing-aside__inner">${blocks}</div>`;
}

/** @param {string} str */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
