// metro.config.js — NativeWind v4 entegrasyonu
// "type": "commonjs" apps/expo/package.json'da tanımlı olduğundan
// bu dosya CJS olarak yüklenir; Windows ESM URL hatası önlenir.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
