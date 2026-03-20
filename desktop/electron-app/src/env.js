import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_APP_NAME = 'Project Manager Secure';
const DEFAULT_APP_ID = 'com.projectmanager.secure';
const DEFAULT_PACKAGED_RENDERER_URL = 'https://pm-collab-secure-20260319.vercel.app';

export function getRuntimeConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    appName: process.env.ELECTRON_APP_NAME?.trim() || DEFAULT_APP_NAME,
    appId: process.env.ELECTRON_APP_ID?.trim() || DEFAULT_APP_ID,
    updateUrl: process.env.ELECTRON_UPDATE_URL?.trim() || '',
    updateChannel: process.env.ELECTRON_UPDATE_CHANNEL?.trim() || 'latest',
    rendererUrl: process.env.RENDERER_URL?.trim() || (isDevelopment ? '' : DEFAULT_PACKAGED_RENDERER_URL),
    logLevel: process.env.ELECTRON_LOG_LEVEL?.trim() || 'info'
  };
}

export function isLocalhostUrl(value) {
  try {
    const url = new URL(value);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

export function normalizeRemoteUrl(value, { allowHttpLocalhost = false } = {}) {
  if (!value) {
    return '';
  }

  const url = new URL(value);
  const isLocalhost = isLocalhostUrl(url.toString());

  if (url.protocol === 'https:') {
    return url.toString();
  }

  if (allowHttpLocalhost && isLocalhost && url.protocol === 'http:') {
    return url.toString();
  }

  throw new Error(`Insecure URL rejected: ${value}`);
}

export function getLocalRendererEntry() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  return path.join(root, 'frontend', 'react-app', 'dist', 'index.html');
}

export function getPackagedRendererEntry() {
  return path.join(process.resourcesPath, 'frontend', 'react-app', 'dist', 'index.html');
}
