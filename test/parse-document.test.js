import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { parseDocument } from '../lib/parse-document.js';

const SAMPLE = `---
title: Sample Case
description: One-line pitch
---

# Sample Case

![Hero](src/hero.png)

Opening paragraph for the case study.

| Metric | Value |
| --- | ---: |
| Uplift | 8% |

## First Section

Body of the first section.
`;

test('parseDocument promotes pre-## header into the first poster', () => {
  const doc = parseDocument(SAMPLE, 'sample.md');

  assert.equal(doc.introMarkdown, '');
  assert.equal(doc.posters.length, 2);
  assert.equal(doc.posters[0].isIntroPoster, true);
  assert.equal(doc.posters[0].plainTitle, 'Sample Case');
  assert.match(doc.posters[0].bodyMarkdown, /Opening paragraph/);
  assert.match(doc.posters[0].bodyMarkdown, /!\[Hero\]/);
  assert.match(doc.posters[0].bodyMarkdown, /\| Uplift \| 8% \|/);
  assert.equal(doc.posters[1].plainTitle, 'First Section');
  assert.equal(doc.toc[0].text, 'Sample Case');
});

test('parseDocument keeps collection hero when there is no pre-## body', () => {
  const doc = parseDocument('# Title Only\n\n## Section\n\nBody.', 'short.md');

  assert.equal(doc.introMarkdown, '');
  assert.equal(doc.posters.length, 1);
  assert.equal(doc.posters[0].isIntroPoster, undefined);
  assert.equal(doc.posters[0].plainTitle, 'Section');
});

test('parseDocument uses live case study header shape', () => {
  const text = readFileSync('content/01-figlets-mcp.md', 'utf8');
  const doc = parseDocument(text, '01-figlets-mcp.md');

  assert.equal(doc.posters[0].isIntroPoster, true);
  assert.equal(doc.posters[0].plainTitle, 'Figlets MCP');
  assert.match(doc.posters[0].bodyMarkdown, /AI hosts/);
});
