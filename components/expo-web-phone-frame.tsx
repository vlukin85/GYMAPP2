/**
 * Web preview design: present IronRise as a physical phone on desktop canvases,
 * while preserving the native full-bleed layout on actual small touch screens.
 */
import type { ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import type { ViewStyle } from "react-native";

type ExpoWebPhoneFrameProps = { children: ReactNode };

export function ExpoWebPhoneFrame({ children }: ExpoWebPhoneFrameProps) {
  const { width, height } = useWindowDimensions();
  const showDeviceChrome = width >= 640;

  if (!showDeviceChrome) return <>{children}</>;

  const deviceHeight = Math.min(900, Math.max(640, height - 44));
  const deviceWidth = Math.min(430, Math.max(280, width - 48));

  return (
    <View style={styles.stage}>
      <View style={[styles.device, { height: deviceHeight, width: deviceWidth }]}>
        <View style={styles.notch} />
        <View style={styles.screen}>{children}</View>
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create<Record<"stage" | "device" | "screen" | "notch" | "homeIndicator", ViewStyle>>({
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
    backgroundColor: "#191713",
  },
  device: {
    width: 430,
    padding: 9,
    borderRadius: 46,
    backgroundColor: "#0d0d0c",
    borderWidth: 1,
    borderColor: "#635f58",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.42,
    shadowRadius: 34,
    elevation: 18,
  },
  screen: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 37,
    backgroundColor: "#f5f1e8",
  },
  notch: {
    position: "absolute",
    zIndex: 20,
    top: 16,
    alignSelf: "center",
    width: 116,
    height: 25,
    borderRadius: 14,
    backgroundColor: "#0d0d0c",
  },
  homeIndicator: {
    position: "absolute",
    zIndex: 20,
    bottom: 14,
    alignSelf: "center",
    width: 122,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#f7f5ef",
    opacity: 0.82,
  },
});
