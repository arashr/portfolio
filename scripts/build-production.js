#!/usr/bin/env node
/**
 * Production build: minified CSS/JS bundles + lean static output in dist/.
 * Dev (`npm start`) serves the repo root unchanged.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { buildImageVariants } from '../lib/image-variants-node.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(repoRoot, 'dist');
const assetsOut = join(distRoot, 'assets');

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function logOutputSize(label, filePath) {
  const bytes = readFileSync(filePath).length;
  console.log(`  ${label}: ${formatBytes(bytes)}`);
}

function buildContentIndex() {
  const result = spawnSync('node', ['scripts/build-content-index.js'], {
    cwd: repoRoot,
    stdio: 'inherit'
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function prepareDist() {
  rmSync(distRoot, { recursive: true, force: true });
  mkdirSync(assetsOut, { recursive: true });
}

async function bundleAssets() {
  await esbuild.build({
    entryPoints: [join(repoRoot, 'assets/portfolio.js')],
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['es2020'],
    outfile: join(assetsOut, 'portfolio.js'),
    logLevel: 'warning'
  });

  await esbuild.build({
    entryPoints: {
      site: join(repoRoot, 'assets/site.css'),
      reader: join(repoRoot, 'assets/reader.css'),
      portfolio: join(repoRoot, 'assets/portfolio.css')
    },
    bundle: true,
    minify: true,
    outdir: assetsOut,
    logLevel: 'warning'
  });

  console.log('Bundled assets:');
  logOutputSize('JS (app + lib + marked + DOMPurify)', join(assetsOut, 'portfolio.js'));
  logOutputSize('CSS site.css', join(assetsOut, 'site.css'));
  logOutputSize('CSS reader.css', join(assetsOut, 'reader.css'));
  logOutputSize('CSS portfolio.css', join(assetsOut, 'portfolio.css'));
}

function copyStaticFiles() {
  cpSync(join(repoRoot, 'content'), join(distRoot, 'content'), { recursive: true });
  cpSync(join(repoRoot, 'config'), join(distRoot, 'config'), { recursive: true });

  for (const file of [
    'robots.txt',
    '.nojekyll',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'apple-touch-icon.png'
  ]) {
    cpSync(join(repoRoot, file), join(distRoot, file));
  }
}

async function optimizeContentImages() {
  const { imageCount, bytesBefore, bytesAfter } = await buildImageVariants(distRoot, repoRoot);
  if (!imageCount) {
    console.log('  Images: none to optimize');
    return;
  }
  const saved = Math.max(0, bytesBefore - bytesAfter);
  const pct = bytesBefore > 0 ? Math.round((saved / bytesBefore) * 100) : 0;
  console.log(
    `  Images: ${imageCount} raster file(s), WebP variants ${formatBytes(bytesAfter)} (originals kept as fallback, ~${pct}% smaller than PNG/JPG alone for WebP-capable browsers)`
  );
}

function writeIndexHtml() {
  const html = readFileSync(join(repoRoot, 'index.html'), 'utf8');
  const withoutImportMap = html.replace(
    /\n?\s*<script type="importmap">[\s\S]*?<\/script>/,
    ''
  );
  const withPreload = withoutImportMap.replace(
    '<link rel="stylesheet" href="assets/site.css">',
    [
      '  <link rel="preload" href="assets/site.css" as="style">',
      '  <link rel="stylesheet" href="assets/site.css">'
    ].join('\n')
  ).replace(
    '<script type="module" src="assets/portfolio.js"></script>',
    [
      '  <link rel="modulepreload" href="assets/portfolio.js">',
      '  <script type="module" src="assets/portfolio.js"></script>'
    ].join('\n')
  );
  writeFileSync(join(distRoot, 'index.html'), withPreload, 'utf8');
}

console.log('Building production bundle…');
buildContentIndex();
prepareDist();
await bundleAssets();
copyStaticFiles();
await optimizeContentImages();
writeIndexHtml();
console.log(`Done → ${distRoot}`);
