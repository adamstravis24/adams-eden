const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure package.json "exports" subpaths are resolved (needed for e.g. firebase/auth/react-native)
config.resolver = config.resolver || {};
config.resolver.unstable_enablePackageExports = true;

module.exports = config;