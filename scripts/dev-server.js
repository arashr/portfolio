#!/usr/bin/env node
import { createServer, request } from 'node:http';
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { join } from 'node:path';
import { buildContentIndexPayload } from '../lib/content-index-node.js';
import { CONTENT_DIR, CONTENT_INDEX_PATH } from '../lib/content-catalog.js';

const repoRoot = process.cwd();
/** @type {ReturnType<typeof buildContentIndexPayload> | null} */
let contentIndexCache = null;
let contentWatchTimer = 0;
const host = '127.0.0.1';
const upstreamPort = Number(process.env.SERVE_PORT) || 3001;
const port = Number(process.env.PORT) || 3000;
const indexPath = `/${CONTENT_INDEX_PATH}`;

const serve = spawn('npx', ['serve', '.', '-l', String(upstreamPort)], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

serve.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

function proxy(req, res) {
  const upstream = request(
    {
      hostname: host,
      port: upstreamPort,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `${host}:${upstreamPort}` }
    },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    }
  );
  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Static server unavailable — is port ' + upstreamPort + ' free?');
  });
  req.pipe(upstream);
}

function invalidateContentIndex() {
  contentIndexCache = null;
}

function getContentIndexPayload() {
  if (!contentIndexCache) {
    contentIndexCache = buildContentIndexPayload();
  }
  return contentIndexCache;
}

function startContentWatch() {
  const contentDir = join(repoRoot, CONTENT_DIR);
  try {
    watch(contentDir, { recursive: true }, () => {
      clearTimeout(contentWatchTimer);
      contentWatchTimer = setTimeout(invalidateContentIndex, 200);
    });
  } catch {
    // Non-recursive platforms still get stable revision-based change detection.
  }
}

const server = createServer((req, res) => {
  const pathname = req.url?.split('?')[0] || '';
  if (req.method === 'GET' && pathname === indexPath) {
    const payload = getContentIndexPayload();
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }
  proxy(req, res);
});

server.listen(port, () => {
  startContentWatch();
  console.log(`\n  MD Portfolio (dev)`);
  console.log(`  → http://localhost:${port}`);
  console.log(`  Content reloads when you save files under content/ — not on every poll.\n`);
});

function shutdown() {
  serve.kill('SIGTERM');
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
