// metro.config.cjs — CommonJS formatı zorunlu (Windows ESM uyumsuzluğu)
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
