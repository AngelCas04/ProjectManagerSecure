function getPublishConfig() {
  const updateUrl = process.env.ELECTRON_UPDATE_URL;

  if (!updateUrl) {
    return undefined;
  }

  return [
    {
      provider: 'generic',
      url: updateUrl,
      channel: process.env.ELECTRON_UPDATE_CHANNEL || 'latest'
    }
  ];
}

const config = {
  appId: process.env.ELECTRON_APP_ID || 'com.projectmanager.secure',
  productName: process.env.ELECTRON_APP_NAME || 'Project Manager Secure',
  artifactName: '${productName}-${version}-${arch}.${ext}',
  directories: {
    output: 'release',
    buildResources: 'build'
  },
  files: ['src/**/*', 'package.json'],
  extraResources: [
    {
      from: '../../frontend/react-app/dist',
      to: 'frontend/react-app/dist',
      filter: ['**/*']
    }
  ],
  asar: true,
  compression: 'maximum',
  electronUpdaterCompatibility: '>=2.16',
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    requestedExecutionLevel: 'asInvoker'
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Project Manager Secure',
    artifactName: '${productName}-Setup-${version}.${ext}'
  }
};

const publish = getPublishConfig();

if (publish) {
  config.publish = publish;
}

module.exports = config;
