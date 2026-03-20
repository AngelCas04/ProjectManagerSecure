import { access, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const devUpdateConfigPath = path.join(projectRoot, 'dev-app-update.yml');
const updateUrl = process.env.ELECTRON_UPDATE_URL?.trim();

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!updateUrl) {
    if (await exists(devUpdateConfigPath)) {
      await rm(devUpdateConfigPath, { force: true });
    }

    return;
  }

  const content = [
    'provider: generic',
    `url: ${updateUrl}`,
    `channel: ${process.env.ELECTRON_UPDATE_CHANNEL || 'latest'}`
  ].join('\n');

  await writeFile(devUpdateConfigPath, `${content}\n`, 'utf8');
}

main().catch((error) => {
  console.error('Failed to prepare dev update config:', error);
  process.exitCode = 1;
});
