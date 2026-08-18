const { withNativeWind } = require("nativewind/metro");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Keep NativeWind CSS virtual. Writing it into node_modules/.cache makes
  // Metro's production web build look for an unwatched file in Docker.
  // The virtual module works for Android and the browser preview alike.
});
