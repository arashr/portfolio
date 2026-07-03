export const DEFAULT_TITLE_LINES = ['Koggle', 'Plahhos'];

/**
 * @param {[string, string]} lines
 * @param {(str: string) => string} escapeHtml
 */
export function renderTwoLineTitleHtml(lines, escapeHtml) {
  const [line1 = '', line2 = ''] = lines;
  return `<span class="demo-title">
    <span class="demo-title__line">${escapeHtml(line1)}</span>
    <span class="demo-title__line">${escapeHtml(line2)}</span>
  </span>`;
}
