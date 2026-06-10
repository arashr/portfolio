import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { applyImageTableLayouts, isImageGridTable } from '../lib/image-table-layout.js';

/** @param {string} html */
function tableFrom(html) {
  const dom = new JSDOM(`<div class="prose">${html}</div>`);
  const table = dom.window.document.querySelector('table');
  assert.ok(table);
  return /** @type {HTMLTableElement} */ (table);
}

test('isImageGridTable is true when every tbody cell is a single image', () => {
  const table = tableFrom(`
    <div class="table-wrap"><table>
      <thead><tr><th>A</th><th>B</th></tr></thead>
      <tbody>
        <tr>
          <td><img src="a.png" alt="A"></td>
          <td><img src="b.png" alt="B"></td>
        </tr>
      </tbody>
    </table></div>
  `);
  assert.equal(isImageGridTable(table), true);
});

test('isImageGridTable is false for text tables', () => {
  const table = tableFrom(`
    <table>
      <tbody>
        <tr><td>8%</td><td>+364K</td></tr>
      </tbody>
    </table>
  `);
  assert.equal(isImageGridTable(table), false);
});

test('isImageGridTable is false when any body cell mixes text and image', () => {
  const table = tableFrom(`
    <table>
      <tbody>
        <tr>
          <td><img src="a.png" alt="A"></td>
          <td>Notes</td>
        </tr>
      </tbody>
    </table>
  `);
  assert.equal(isImageGridTable(table), false);
});

test('applyImageTableLayouts tags image-grid tables only', () => {
  const dom = new JSDOM(`
    <div id="root">
      <div class="prose">
        <div class="table-wrap"><table id="images">
          <tbody><tr><td><img src="a.png" alt="A"></td><td><img src="b.png" alt="B"></td></tr></tbody>
        </table></div>
        <div class="table-wrap"><table id="stats">
          <tbody><tr><td>8%</td><td>50+</td></tr></tbody>
        </table></div>
      </div>
    </div>
  `);
  const root = dom.window.document.getElementById('root');
  applyImageTableLayouts(root);
  assert.equal(dom.window.document.getElementById('images')?.classList.contains('table-cols-equal'), true);
  assert.equal(dom.window.document.getElementById('stats')?.classList.contains('table-cols-equal'), false);
});
