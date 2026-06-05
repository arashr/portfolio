#!/usr/bin/env node
import { createServer, request } from 'node:http';
import { spawn } from 'node:child_process';
import { buildContentIndexPayload } from '../lib/content-index-node.js';
import { CONTENT_INDEX_PATH } from '../lib/content-catalog.js';

const repoRoot = process.cwd();
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

const server = createServer((req, res) => {
  const pathname = req.url?.split('?')[0] || '';
  if (req.method === 'GET' && pathname === indexPath) {
    const payload = buildContentIndexPayload();
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
  console.log(`\n  MD Portfolio (dev)`);
  console.log(`  → http://localhost:${port}`);
  console.log(`  Content index rebuilds on each request — save a .md file and the app refreshes.\n`);
});

function shutdown() {
  serve.kill('SIGTERM');
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
