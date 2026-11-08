/**
 * Конфиг-плагин IronRise: фикс версий Google Play services для react-native-google-fit.
 *
 * Проблема: библиотека тянет play-services-auth/fitness с динамической версией `+`.
 * play-services-auth 22.0.0 (август 2026) УДАЛИЛ классы Google Sign-In
 * (GoogleSignIn/GoogleSignInClient/GoogleSignInAccount) — компиляция библиотеки падает
 * с "cannot find symbol".
 *
 * Решение: закрепить версии в rootProject.ext (их читает safeExtGet библиотеки):
 * auth 21.6.0 — последняя с GoogleSignIn, fitness 21.0.0 — стабильная пара.
 */
const { withProjectBuildGradle } = require("@expo/config-plugins");

const VERSIONS_BLOCK = `
// IronRise: закрепление версий Google Play services для react-native-google-fit
// (play-services-auth 22.0.0 удалил классы GoogleSignIn — см. docs/setup-google-fit.md)
ext {
    authVersion = "21.6.0"
    fitnessVersion = "21.0.0"
}
`;

function withGoogleFitVersions(config) {
  return withProjectBuildGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (!contents.includes("authVersion")) {
      // Вставляем ext-блок до первого apply/buildscript-использования —
      // сразу после шапки файла.
      const anchor = contents.indexOf("buildscript");
      const insertAt = anchor === -1 ? 0 : anchor;
      contents =
        contents.slice(0, insertAt) +
        VERSIONS_BLOCK +
        "\n" +
        contents.slice(insertAt);
      modConfig.modResults.contents = contents;
    }
    return modConfig;
  });
}

module.exports = withGoogleFitVersions;
