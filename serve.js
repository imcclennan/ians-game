/*
 * A tiny static file server for local play: node serve.js [port]
 * The game itself is plain files, so opening index.html directly works too --
 * this is only here for browsers that are strict about file:// pages.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.argv[2] || process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer((request, response) => {
  const url = decodeURIComponent(request.url.split('?')[0]);
  const requested = path.normalize(path.join(root, url === '/' ? '/index.html' : url));

  if (!requested.startsWith(root)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(requested, (error, body) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': TYPES[path.extname(requested).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    }).end(body);
  });
}).listen(port, () => {
  console.log('Ian\'s Game is at http://localhost:' + port);
});
