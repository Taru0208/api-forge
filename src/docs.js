// Auto-generated API documentation from OpenAPI spec
import spec from '../openapi.json';

export function generateDocs() {
  const categories = {};

  for (const [path, methods] of Object.entries(spec.paths)) {
    if (path === '/health' || path === '/' || path === '/openapi.json') continue;
    const cat = path.split('/')[1] || 'other';
    if (!categories[cat]) categories[cat] = [];

    for (const [method, endpoint] of Object.entries(methods)) {
      const props = endpoint.requestBody?.content?.['application/json']?.schema?.properties || {};
      const required = endpoint.requestBody?.content?.['application/json']?.schema?.required || [];
      const queryParams = (endpoint.parameters || []).filter(p => p.in === 'query');
      const respProps = endpoint.responses?.['200']?.content?.['application/json']?.schema?.properties || {};

      const bodyParams = Object.entries(props).map(([name, p]) => ({
        name,
        type: p.type || 'any',
        required: required.includes(name),
        example: p.example !== undefined ? JSON.stringify(p.example) : '',
        default: p.default !== undefined ? JSON.stringify(p.default) : '',
        enum: p.enum,
      }));
      const qParams = queryParams.map(p => ({
        name: p.name + ' (query)',
        type: p.schema?.type || 'string',
        required: !!p.required,
        example: p.example !== undefined ? JSON.stringify(p.example) : (p.schema?.example !== undefined ? JSON.stringify(p.schema.example) : ''),
        default: p.schema?.default !== undefined ? JSON.stringify(p.schema.default) : '',
        enum: p.schema?.enum,
      }));

      categories[cat].push({
        method: method.toUpperCase(),
        path,
        summary: endpoint.summary || '',
        params: [...bodyParams, ...qParams],
        response: Object.entries(respProps).map(([name, p]) => ({
          name,
          type: p.type || 'any',
          example: p.example !== undefined ? JSON.stringify(p.example) : '',
        })),
      });
    }
  }

  const catNames = {
    text: 'Text Processing',
    transform: 'Data Transform',
    hash: 'Hashing',
    encode: 'Encoding',
    decode: 'Decoding',
    uuid: 'UUID',
    validate: 'Validation',
    generate: 'Random Generation',
    datetime: 'Date & Time',
    regex: 'Regular Expressions',
    ip: 'IP & Network',
    string: 'String Case Conversion',
    color: 'Color Utilities',
    json: 'JSON Utilities',
    number: 'Number Formatting',
    convert: 'Unit Conversion',
    faker: 'Fake Test Data',
    security: 'Security',
    language: 'Language Detection',
    qr: 'QR Code',
    cron: 'Cron Expressions',
    xml: 'XML Processing',
  };

  let nav = '';
  let sections = '';
  let epIndex = 0;

  for (const [cat, endpoints] of Object.entries(categories)) {
    const displayName = catNames[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
    nav += `<a href="#${cat}">${displayName} <span class="count">${endpoints.length}</span></a>`;

    sections += `<h2 id="${cat}">${displayName}</h2>`;

    for (const ep of endpoints) {
      const methodClass = ep.method === 'GET' ? 'get' : 'post';
      const id = `ep-${epIndex++}`;

      let paramsHtml = '';
      if (ep.params.length > 0) {
        paramsHtml = '<table><tr><th>Parameter</th><th>Type</th><th>Required</th><th>Example</th></tr>';
        for (const p of ep.params) {
          const req = p.required ? '<span class="req">yes</span>' : 'no';
          const example = p.example || p.default || (p.enum ? p.enum.join(' | ') : '');
          paramsHtml += `<tr><td><code>${p.name}</code></td><td>${p.type}</td><td>${req}</td><td>${example}</td></tr>`;
        }
        paramsHtml += '</table>';
      }

      // Build example body
      const exampleBody = {};
      for (const p of ep.params) {
        if (p.example) exampleBody[p.name] = JSON.parse(p.example);
        else if (p.default) exampleBody[p.name] = JSON.parse(p.default);
      }

      // Build curl example
      let curlExample = '';
      if (ep.method === 'GET') {
        curlExample = `curl ${spec.servers[0].url}${ep.path}`;
      } else {
        curlExample = `curl -X POST ${spec.servers[0].url}${ep.path} \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(exampleBody)}'`;
      }

      // Try it section
      let tryItHtml = '';
      if (ep.method === 'POST') {
        const bodyStr = escapeHtml(JSON.stringify(exampleBody, null, 2));
        tryItHtml = `
  <div class="try-it" id="${id}">
    <textarea id="${id}-body" rows="4" spellcheck="false">${bodyStr}</textarea>
    <div class="try-actions">
      <button onclick="tryEndpoint('${ep.method}','${ep.path}','${id}')">Send</button>
      <span class="try-status" id="${id}-status"></span>
    </div>
    <pre class="try-result" id="${id}-result"></pre>
  </div>`;
      } else {
        tryItHtml = `
  <div class="try-it" id="${id}">
    <div class="try-actions">
      <button onclick="tryEndpoint('${ep.method}','${ep.path}','${id}')">Send</button>
      <span class="try-status" id="${id}-status"></span>
    </div>
    <pre class="try-result" id="${id}-result"></pre>
  </div>`;
      }

      sections += `
<div class="endpoint">
  <div class="ep-header">
    <span class="method ${methodClass}">${ep.method}</span>
    <code class="path">${ep.path}</code>
    <span class="summary">${ep.summary}</span>
  </div>
  ${paramsHtml}
  <details><summary>curl</summary><pre><code>${escapeHtml(curlExample)}</code></pre></details>
  <details><summary>Try it</summary>${tryItHtml}</details>
</div>`;
    }
  }

  const totalEndpoints = Object.values(categories).reduce((sum, eps) => sum + eps.length, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>API Forge — Free Developer Toolkit API (${totalEndpoints} Endpoints)</title>
<meta name="description" content="Free REST API with ${totalEndpoints} endpoints: text processing, QR codes, barcodes, hashing, encoding, fake data, math, language detection, MIME types, and more. No auth required, zero dependencies.">
<meta name="keywords" content="free api, rest api, text processing api, qr code api, barcode api, hash api, encoding api, fake data api, developer tools, no auth api">
<meta property="og:title" content="API Forge — Free Developer Toolkit API">
<meta property="og:description" content="Free REST API with ${totalEndpoints} endpoints. Text, QR codes, barcodes, math, fake data, and more. No auth required.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://api-forge.quietnode.workers.dev/docs">
<link rel="canonical" href="https://api-forge.quietnode.workers.dev/docs">
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebAPI",
  "name": "API Forge",
  "description": `Free REST API with ${totalEndpoints} endpoints for text processing, QR codes, barcodes, hashing, encoding, fake data, math, language detection, and more.`,
  "url": "https://api-forge.quietnode.workers.dev",
  "documentation": "https://api-forge.quietnode.workers.dev/docs",
  "termsOfService": "https://api-forge.quietnode.workers.dev/docs",
  "provider": { "@type": "Organization", "name": "API Forge" },
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
})}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#0d1117;color:#c9d1d9;line-height:1.6}
.container{max-width:960px;margin:0 auto;padding:20px}
h1{color:#58a6ff;margin-bottom:4px;font-size:1.8em}
.subtitle{color:#8b949e;margin-bottom:24px;font-size:0.95em}
h2{color:#58a6ff;margin:32px 0 16px;padding-bottom:8px;border-bottom:1px solid #21262d;font-size:1.3em}
nav{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:28px}
nav a{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:4px 12px;color:#c9d1d9;text-decoration:none;font-size:0.85em;transition:border-color 0.2s}
nav a:hover{border-color:#58a6ff}
nav .count{color:#8b949e;font-size:0.8em}
.endpoint{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:14px;margin-bottom:10px}
.ep-header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.method{font-size:0.75em;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.5px}
.get{background:#1f3a2c;color:#3fb950}.post{background:#2d1f1f;color:#f97583}
.path{color:#d2a8ff;font-size:0.95em}
.summary{color:#8b949e;font-size:0.85em}
table{width:100%;margin-top:10px;border-collapse:collapse;font-size:0.85em}
th{text-align:left;color:#8b949e;padding:6px 8px;border-bottom:1px solid #30363d}
td{padding:6px 8px;border-bottom:1px solid #21262d}
.req{color:#f97583}
details{margin-top:8px}
summary{color:#58a6ff;cursor:pointer;font-size:0.85em;user-select:none}
details pre{margin-top:6px;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:10px;overflow-x:auto;font-size:0.82em}
details code{color:#c9d1d9}
.links{margin-top:10px;font-size:0.85em;color:#8b949e}
.links a{color:#58a6ff;text-decoration:none}
.links a:hover{text-decoration:underline}
.try-it{margin-top:6px}
.try-it textarea{width:100%;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;padding:8px;font-family:SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;font-size:0.82em;resize:vertical;tab-size:2}
.try-actions{display:flex;align-items:center;gap:10px;margin-top:6px}
.try-actions button{background:#238636;color:#fff;border:none;border-radius:6px;padding:5px 16px;font-size:0.82em;font-weight:600;cursor:pointer;transition:background 0.2s}
.try-actions button:hover{background:#2ea043}
.try-actions button:disabled{background:#21262d;color:#8b949e;cursor:default}
.try-status{font-size:0.8em;color:#8b949e}
.try-result{margin-top:6px;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:10px;font-size:0.82em;display:none;max-height:300px;overflow:auto}
.try-result.visible{display:block}
.try-result.error{border-color:#f85149}
.status-ok{color:#3fb950}.status-err{color:#f85149}
</style>
</head>
<body>
<div class="container">
<h1>API Forge</h1>
<p class="subtitle">${totalEndpoints} endpoints — free developer toolkit API. No auth required.</p>
<p class="links">
  Base URL: <code>${spec.servers[0].url}</code> &middot;
  <a href="/openapi.json">OpenAPI Spec</a> &middot;
  <a href="https://github.com/Taru0208/api-forge">GitHub</a>
</p>
<nav>${nav}</nav>
${sections}
</div>
<script>
async function tryEndpoint(method, path, id) {
  const btn = document.querySelector('#' + id + ' button');
  const status = document.getElementById(id + '-status');
  const result = document.getElementById(id + '-result');
  const textarea = document.getElementById(id + '-body');

  btn.disabled = true;
  status.textContent = 'Sending...';
  status.className = 'try-status';
  result.className = 'try-result';
  result.textContent = '';

  const opts = { method };
  if (method === 'POST' && textarea) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = textarea.value;
  }

  try {
    const t0 = performance.now();
    const res = await fetch(path, opts);
    const ms = Math.round(performance.now() - t0);
    const data = await res.json();

    status.textContent = res.status + ' ' + res.statusText + ' (' + ms + 'ms)';
    status.className = 'try-status ' + (res.ok ? 'status-ok' : 'status-err');
    result.textContent = JSON.stringify(data, null, 2);
    result.className = 'try-result visible' + (res.ok ? '' : ' error');
  } catch (e) {
    status.textContent = 'Error';
    status.className = 'try-status status-err';
    result.textContent = e.message;
    result.className = 'try-result visible error';
  } finally {
    btn.disabled = false;
  }
}
</script>
</body>
</html>`;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
