/**
 * Equal column widths for prose tables whose body cells are image-only.
 */

/** @param {Element} cell */
function isImageOnlyCell(cell) {
  const imgs = cell.querySelectorAll('img');
  if (imgs.length !== 1) return false;

  const clone = cell.cloneNode(true);
  if (!clone || clone.nodeType !== 1) return false;
  clone.querySelectorAll('img, br').forEach((node) => node.remove());
  if (clone.textContent?.trim()) return false;
  return !clone.querySelector('a, video, picture, svg, table, ul, ol, pre, code, p, div, span');
}

/** @param {HTMLTableElement} table */
export function isImageGridTable(table) {
  const bodyCells = table.querySelectorAll('tbody td');
  if (!bodyCells.length) return false;
  return [...bodyCells].every((cell) => isImageOnlyCell(cell));
}

/** @param {ParentNode} root */
export function applyImageTableLayouts(root) {
  if (!root) return;

  root.querySelectorAll('.prose .table-wrap table, .prose table').forEach((table) => {
    if (!table?.classList || table.tagName !== 'TABLE') return;
    const equalize = isImageGridTable(/** @type {HTMLTableElement} */ (table));
    table.classList.toggle('table-cols-equal', equalize);
  });
}
