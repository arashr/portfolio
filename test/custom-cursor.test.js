import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { resolveCursorState, ctaKeyForTarget, nextCtaTiltDegrees, CTA_TILT_ANGLES } from '../lib/custom-cursor.js';

/** @param {string} html */
function stateAt(html, selector) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const el = dom.window.document.querySelector(selector);
  assert.ok(el);
  return resolveCursorState(el);
}

test('resolveCursorState returns default on plain body', () => {
  const dom = new JSDOM('<body><p>Hello</p></body>');
  const p = dom.window.document.querySelector('p');
  assert.equal(resolveCursorState(p), 'default');
});

test('resolveCursorState returns cta on landing pick cards', () => {
  assert.equal(
    stateAt(
      '<div id="landing-posters"><div class="post-card-wrap landing-pick-wrap"><button class="post-card landing-pick-card" type="button" data-md-path="a.md">Case</button></div></div>',
      'button'
    ),
    'cta'
  );
});

test('resolveCursorState returns default on name hero', () => {
  assert.equal(
    stateAt(
      '<div id="landing-name" class="post-card-wrap landing-name-wrap"><article class="post-card landing-name-card title-face-bricolage-grotesque"><h1>Name</h1></article></div>',
      'article'
    ),
    'default'
  );
});

test('resolveCursorState returns link on chrome links and buttons', () => {
  assert.equal(
    stateAt('<footer class="landing-foot"><a class="chrome-link" href="https://example.com">GitHub</a></footer>', 'a'),
    'link'
  );
  assert.equal(
    stateAt('<button type="button" id="toc-toggle" class="btn-ghost">Contents</button>', 'button'),
    'link'
  );
});

test('resolveCursorState returns link on prose inline and table links', () => {
  assert.equal(
    stateAt(
      '<div class="prose"><p>See <a href="https://example.com">docs</a> for more.</p></div>',
      'a'
    ),
    'link'
  );
  assert.equal(
    stateAt(
      '<div class="prose"><table><tbody><tr><td><a href="https://example.com">Source</a></td></tr></tbody></table></div>',
      'a'
    ),
    'link'
  );
});

test('resolveCursorState returns default on hash anchors', () => {
  assert.equal(
    stateAt(
      '<div id="posters"><div class="post-card-wrap"><article class="post-card"><div class="prose"><a href="#intro">Intro</a></div></article></div></div>',
      'a'
    ),
    'default'
  );
  assert.equal(
    stateAt(
      '<nav class="toc-panel"><a href="#intro" data-toc-link>Intro</a></nav>',
      'a'
    ),
    'default'
  );
  assert.equal(
    stateAt(
      '<h2 class="poster__title post-title"><a href="#intro">Intro</a></h2>',
      'a'
    ),
    'default'
  );
});

test('resolveCursorState returns cta on reader more-case picks', () => {
  assert.equal(
    stateAt(
      '<div class="reader-more-cases"><button type="button" class="post-card mini-poster landing-pick-card" data-md-path="other.md">Other</button></div>',
      'button'
    ),
    'cta'
  );
});

test('resolveCursorState returns default on reader posters', () => {
  assert.equal(
    stateAt(
      '<div id="posters"><div class="post-card-wrap"><article class="post-card"><h2>Title</h2></article></div></div>',
      'article'
    ),
    'default'
  );
});

test('resolveCursorState returns plus on prose images', () => {
  assert.equal(
    stateAt('<div class="prose"><img class="prose-img--zoomable" src="a.png" alt=""></div>', 'img'),
    'plus'
  );
});

test('resolveCursorState returns close on lightbox backdrop only', () => {
  const dom = new JSDOM(`
    <dialog id="image-lightbox" class="image-lightbox" open>
      <div class="image-lightbox__shell"><img class="image-lightbox__img" src="a.png" alt=""></div>
    </dialog>
  `);
  const dialog = dom.window.document.getElementById('image-lightbox');
  const img = dom.window.document.querySelector('.image-lightbox__img');
  assert.equal(resolveCursorState(img), 'default');
  assert.equal(resolveCursorState(dialog), 'close');
});

test('ctaKeyForTarget reads data-md-path from landing picks', () => {
  const dom = new JSDOM(
    '<button class="landing-pick-card" type="button" data-md-path="a.md"><span>Case</span></button>'
  );
  const span = dom.window.document.querySelector('span');
  assert.equal(ctaKeyForTarget(span), 'a.md');
});

test('nextCtaTiltDegrees toggles between negative and positive CTA angles', () => {
  const [a, b] = CTA_TILT_ANGLES;
  assert.equal(nextCtaTiltDegrees(a), b);
  assert.equal(nextCtaTiltDegrees(b), a);
  assert.ok(a < 0 && b > 0);
});
