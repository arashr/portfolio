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

test('peekCaseStudyListing parses intro stats table', () => {
  const md = `---
description: Lifted clicks by 8%
role: Lead Product Designer
year: 2023
---

# Atolls Conversion Growth

| CTR Increase | Sessions tested | Brands |
|---:|---:|---:|
| 8% | +364K | 50+ |

## Context
`;
  const { title, subtext, stats, credit } = peekCaseStudyListing(md, 'atolls.md');
  assert.equal(title, 'Atolls Conversion Growth');
  assert.equal(subtext, 'Lifted clicks by 8%');
  assert.equal(credit, 'Lead Product Designer – 2023');
  assert.deepEqual(stats, [
    { value: '8%', label: 'CTR Increase' },
    { value: '+364K', label: 'Sessions tested' },
    { value: '50+', label: 'Brands' }
  ]);
});

test('peekCaseStudyListing splits year from description prefix', () => {
  const md = `---
description: 2024 . Modern on-brand design
role: Product Designer
---

# Project

## Section
`;
  const { subtext, credit } = peekCaseStudyListing(md, 'x.md');
  assert.equal(subtext, 'Modern on-brand design');
  assert.equal(credit, 'Product Designer – 2024');
});
