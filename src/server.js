// Local development server (Node.js)
import { createServer } from 'node:http';
import { handleRequest } from './router.js';

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  const url = `http://localhost:${PORT}${req.url}`;
  const body = await new Promise((resolve) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });

  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? body : undefined,
  });

  const response = await handleRequest(request);
  const responseBody = await response.text();

  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  res.end(responseBody);
});

server.listen(PORT, () => console.log(`API Forge running on http://localhost:${PORT}`));
