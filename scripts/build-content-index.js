#!/usr/bin/env node
import { writeContentIndex } from '../lib/content-index-node.js';

const payload = writeContentIndex();
console.log(`Wrote content/cases.index.json (${payload.cases.length} case stud${payload.cases.length === 1 ? 'y' : 'ies'})`);
