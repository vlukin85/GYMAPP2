# Android branding inspection

Проверка 28 августа 2026:

- `assets/images/android-icon-foreground.png` содержит красный контур щита, но центральная фигура бодибилдера/буква R почти белая и на светлых лаунчерах теряется.
- `assets/images/android-icon-background.png` — непрозрачный тёмный графитовый фон.
- `app.config.ts` использует adaptive icon foreground/background/monochrome, поэтому новый foreground должен быть контрастным внутри Android safe zone, а не белым полупрозрачным знаком.
- `app/_layout.tsx` показывает `IronRiseLaunchSplash` только на web (`showLaunchSplash` стартует с `Platform.OS === "web"`), поэтому бодибилдер не появляется поверх native Android splash.
- Native Expo splash сейчас использует `assets/images/splash-icon.png`, который является только логотипом IronRise, а не фирменным изображением бодибилдера.

- `assets/images/body-silhouette-male.png` — локальный полноразмерный мужской силуэт на прозрачном фоне, пригоден как независимый Android splash asset; его можно использовать без загрузки сети при старте.
