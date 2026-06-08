import { renderMiniPosterGrid } from './render-mini-poster.js';

/**
 * @param {{ path: string, title: string, index: number, subtext?: string, stats?: { value: string, label: string }[], credit?: string }[]} items
 */
export function renderLandingGallery(items) {
  return renderMiniPosterGrid(
    items.map(({ path, title, index, subtext, stats, credit }) => ({
      path,
      title,
      index,
      subtext,
      stats,
      credit
    }))
  );
}
