# Companion prototype verification

The Expo web preview is available at `/dev/companion`.

The first visual state renders a watch-shaped dark face with the IronRise workout remote concept, a large primary action, current exercise/set details, a connection pill, state switcher, and a phone-watch data contract card. The prototype exposes four states: idle, set, rest, and sync. The layout remains readable in the current mobile preview frame and uses large touch targets appropriate for one-handed watch interaction.

The route compiled successfully with TypeScript. The companion regression test passed with three assertions covering states, stateful actions, and the phone-watch contract. Full visual interaction checks are limited by the browser's React Native web mapping: the watch action is rendered as a non-button div in the accessibility extraction, so a real HarmonyOS device or a native emulator is still required to validate crown, vibration, and wearable touch behavior.
