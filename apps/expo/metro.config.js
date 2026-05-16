const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo: watch and resolve from workspace root
config.watchFolders = [workspaceRoot];
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
  extraNodeModules: {
    react: path.resolve(workspaceRoot, 'node_modules/react'),
    'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  },
};

// Paths must be anchored to projectRoot — with EXPO_USE_METRO_WORKSPACE_ROOT,
// process.cwd() may be the monorepo root, so relative paths break Tailwind/NativeWind.
module.exports = withNativeWind(config, {
  input: path.join(projectRoot, 'global.css'),
  configPath: path.join(projectRoot, 'tailwind.config'),
});
