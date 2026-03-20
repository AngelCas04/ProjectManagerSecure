import { shell, session } from 'electron';

function buildContentSecurityPolicy({ rendererUrl, updateUrl, isDev }) {
  const renderer = rendererUrl ? new URL(rendererUrl) : null;
  const rendererOrigin = renderer ? `${renderer.protocol}//${renderer.host}` : '';
  const connectSources = ["'self'", 'https:', 'wss:'];

  if (rendererOrigin) {
    connectSources.push(rendererOrigin);
  }

  if (updateUrl) {
    const updatesOrigin = new URL(updateUrl).origin;
    connectSources.push(updatesOrigin);
  }

  if (isDev) {
    connectSources.push('http://127.0.0.1:5173', 'ws://127.0.0.1:5173');
  }

  const scriptSources = isDev ? ["'self'", "'unsafe-eval'"] : ["'self'"];
  const styleSources = isDev ? ["'self'", "'unsafe-inline'"] : ["'self'", "'unsafe-inline'"];

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    `style-src ${styleSources.join(' ')}`,
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(' ')}`,
    "media-src 'self' data:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
}

export function applySecurityPolicy(win, { rendererUrl, updateUrl, isDev }) {
  const { session: winSession } = win.webContents;
  const csp = buildContentSecurityPolicy({ rendererUrl, updateUrl, isDev });

  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const nextUrl = new URL(url);

      if (nextUrl.protocol === 'https:' || (isDev && nextUrl.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(nextUrl.hostname))) {
        shell.openExternal(nextUrl.toString());
      }
    } catch {
      // Deny malformed URLs.
    }

    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, navUrl) => {
    const allowedUrls = new Set();

    if (rendererUrl) {
      allowedUrls.add(new URL(rendererUrl).origin);
    }

    if (isDev) {
      allowedUrls.add('http://127.0.0.1:5173');
    }

    try {
      const target = new URL(navUrl);

      if (!allowedUrls.has(target.origin) && target.protocol !== 'file:') {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  winSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  winSession.setPermissionCheckHandler(() => false);

  winSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
        'Referrer-Policy': ['no-referrer'],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'Permissions-Policy': ['camera=(), microphone=(), geolocation=(), payment=()']
      }
    });
  });
}
