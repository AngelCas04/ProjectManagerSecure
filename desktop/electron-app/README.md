# Project Manager Desktop

Secure Electron shell for the React frontend that lives in `../../frontend/react-app`.

## Security posture

- `contextIsolation` is enabled.
- `nodeIntegration` is disabled.
- `sandbox` is enabled on the renderer.
- A preload bridge exposes only a small, typed surface.
- Navigation, new windows, and permission prompts are blocked by default.
- Auto-update uses `electron-updater` with a generic HTTPS feed.

## Environment

Copy `.env.example` and set the values that matter for your environment.

- `RENDERER_URL`: Dev server URL for the React app. Default is `http://127.0.0.1:5173`.
- `ELECTRON_UPDATE_URL`: Generic update feed URL used by electron-builder and electron-updater.
- `ELECTRON_APP_NAME`: Windows app name and installer name.
- `ELECTRON_APP_ID`: Windows app id.
- `ELECTRON_LOG_LEVEL`: Electron log verbosity.
- `RENDERER_URL`: optional override for the renderer. Packaged builds default to the published Vercel frontend.
- `WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD`: optional Windows code signing inputs for production builds.

## Development

From `desktop/electron-app`:

```bash
npm install
npm run dev
```

The dev script starts the existing React app from `../../frontend/react-app` and then launches Electron against `http://127.0.0.1:5173`.

If you want to test update wiring locally, set `ELECTRON_UPDATE_URL` before running `npm run dev`. The helper script writes a temporary `dev-app-update.yml` for electron-updater.

## Build

```bash
npm run build
```

Before packaging, the script rebuilds `../../frontend/react-app` so the desktop app ships the current React bundle. The Windows target is NSIS.
When `RENDERER_URL` is not set, the packaged app opens the production frontend at `https://pm-collab-secure-20260319.vercel.app` by default, which keeps the installer usable without local dev servers.

## Auto-update

The packaged app reads its publish metadata from `electron-builder` and the generated `app-update.yml`. The update feed is intentionally environment-driven through `ELECTRON_UPDATE_URL`, which keeps the deployment target out of source control.
