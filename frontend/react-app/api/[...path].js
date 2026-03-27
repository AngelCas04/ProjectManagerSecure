function buildUpstreamUrl(req) {
  const origin = (process.env.BACKEND_ORIGIN || '').replace(/\/+$/, '');
  const pathParts = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  const upstreamPath = pathParts.join('/');
  const incomingUrl = new URL(req.url, 'https://vercel.local');
  const targetUrl = new URL(`${origin}/api/${upstreamPath}`);
  targetUrl.search = incomingUrl.search;
  return targetUrl;
}

function buildRequestBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  if (req.body == null || req.body === '') {
    return undefined;
  }

  if (Buffer.isBuffer(req.body) || typeof req.body === 'string') {
    return req.body;
  }

  return JSON.stringify(req.body);
}

export default async function handler(req, res) {
  const backendOrigin = process.env.BACKEND_ORIGIN;

  if (!backendOrigin) {
    res.status(500).json({ message: 'La pasarela segura no esta configurada.' });
    return;
  }

  const upstreamUrl = buildUpstreamUrl(req);
  const upstreamHeaders = {
    accept: req.headers.accept || 'application/json',
    'content-type': req.headers['content-type'] || 'application/json'
  };

  if (req.headers.cookie) {
    upstreamHeaders.cookie = req.headers.cookie;
  }

  if (req.headers['x-xsrf-token']) {
    upstreamHeaders['x-xsrf-token'] = req.headers['x-xsrf-token'];
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: req.method,
    headers: upstreamHeaders,
    body: buildRequestBody(req),
    redirect: 'manual'
  });

  res.status(upstreamResponse.status);

  const contentType = upstreamResponse.headers.get('content-type');
  if (contentType) {
    res.setHeader('content-type', contentType);
  }

  const setCookie = upstreamResponse.headers.get('set-cookie');
  if (setCookie) {
    res.setHeader('set-cookie', setCookie);
  }

  const responseBody = Buffer.from(await upstreamResponse.arrayBuffer());
  res.send(responseBody);
}
