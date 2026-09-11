# Huawei Watch GT 6 / HarmonyOS research notes

## Official HarmonyOS wearable development page
Source: https://developer.huawei.com/consumer/en/multidevice/wearables/get-started/

Huawei describes wearable apps as companion experiences for wrist-worn devices, with cross-device continuity and lightweight interactions. The official stack uses DevEco Studio, ArkTS, and ArkUI. Huawei explicitly highlights rotating-crown interactions, smart gestures, multi-device preview/debugging, and AppGallery Connect for distribution. The guidance emphasizes focusing on core, lightweight wearable experiences rather than copying a full phone UI.

## Official Huawei Watch GT 6 product page
Source: https://consumer.huawei.com/en/wearables/watch-gt6/

The GT 6 page states compatibility with Android and iOS, 100+ sports modes, indoor sports including strength exercises, wrist-based workout metrics, heart-rate/sleep/SpO2/HRV-related health features, and Bluetooth connectivity. It also mentions standalone music playback and companion-phone interactions. The page does not by itself guarantee that an arbitrary third-party app can access every sensor or run continuously in the background; those capabilities need to be validated against the GT 6 wearable SDK/API level and distribution rules.

## Initial architecture implication

A GT 6 version should be a small native HarmonyOS wearable companion rather than a direct Expo port. The first MVP should prioritize workout selection, current exercise/set, start/finish set, rest countdown with vibration/notification, and basic synchronization with the Android IronRise app. Heart-rate and calorie integrations should be treated as a separate feasibility track until the exact GT 6 API and permissions are confirmed.

## Additional official findings

Huawei's general wearable development best-practice page (updated 2026-09-04) describes wearable apps as small-screen, battery-constrained experiences with touch/buttons/crown interactions, and lists WATCH 5, WATCH Ultimate 2, and WATCH KIDS X as the main wearable products in that guide. It recommends flat navigation, lightweight interactions, one-handed operation, cross-device continuity, and system features such as notifications, Live View, and Service Widget. GT 6 is not explicitly listed in that main wearable product table, so exact GT 6 app compatibility must be confirmed through device-specific SDK/API level and signing checks rather than assumed.

Huawei's support page for managing apps says that supported watches can install third-party apps through AppGallery inside the Huawei Health device screen; if AppGallery is not available there, the feature is not supported for that device/combination. Huawei's GT 6 support page exposes downloads and support but does not itself promise arbitrary third-party app installation. Therefore, a GT 6 IronRise app is technically plausible only if the user's exact GT 6 regional firmware exposes compatible AppGallery/SDK support.

Sources:
- https://developer.huawei.com/consumer/en/doc/best-practices/bpta-smartwatch
- https://developer.huawei.com/consumer/en/doc/design-guides/wearable-overview-0000002197410498
- https://consumer.huawei.com/en/support/wearables/watch-gt6/
- https://consumer.huawei.com/en/support/content/en-us16066729/
