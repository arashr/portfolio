import { renderMiniPosterGrid } from './render-mini-poster.js';

/**
 * Up to two other case studies at the bottom of a reader page (mini-poster picks).
 *
 * @param {{ path: string, title: string, index: number, subtext?: string, stats?: { value: string, label: string }[], credit?: string }[]} items
 * @param {{ colStart?: number }} [opts] — match last poster grid column
 */
export function renderReaderMoreCases(items, { colStart = 1 } = {}) {
  if (!items.length) return '';

  const grid = renderMiniPosterGrid(
    items.map(({ path, title, index, subtext, stats, credit }) => ({
      path,
      title,
      index,
      subtext,
      stats,
      credit
    }))
  );

  return `
    <div class="post-card-wrap reader-more-cases-wrap" style="--poster-col-start: ${colStart}">
      <section class="reader-more-cases" aria-label="More case studies">
        <div class="reader-more-cases__grid" role="list">
          ${grid}
        </div>
      </section>
    </div>`;
}
