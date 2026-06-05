import { test } from 'node:test';
import assert from 'node:assert/strict';
import { peekCaseStudyListing } from '../lib/parse-document.js';

test('peekCaseStudyListing uses frontmatter description', () => {
  const md = `---
description: Design system · 2025
---

# Atolls

Body intro ignored when description is set.

## Section
`;
  const { title, subtext } = peekCaseStudyListing(md, 'atolls.md');
  assert.equal(title, 'Atolls');
  assert.equal(subtext, 'Design system · 2025');
});

test('peekCaseStudyListing uses first intro paragraph', () => {
  const md = `# Example

Homepage card line here.

## Context
`;
  const { title, subtext } = peekCaseStudyListing(md, 'example.md');
  assert.equal(title, 'Example');
  assert.equal(subtext, 'Homepage card line here.');
});

test('peekCaseStudyListing skips headings and images in intro', () => {
  const md = `# Title

### Subtitle

![Hero](src/x.png)
Real description paragraph.

## Next
`;
  const { subtext } = peekCaseStudyListing(md, 'x.md');
  assert.equal(subtext, 'Real description paragraph.');
});
