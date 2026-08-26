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

  // Keep the entire handset within the browser viewport. Width follows the
  // available height, preserving a tall phone ratio instead of introducing a
  // page scrollbar on short desktop windows.
  const stageInset = 28;
  const phoneAspectRatio = 1.94;
  const availableWidth = Math.max(1, width - 48);
  const availableHeight = Math.max(1, height - stageInset);
  const deviceWidth = Math.min(430, availableWidth, availableHeight / phoneAspectRatio);
  const deviceHeight = deviceWidth * phoneAspectRatio;
  // The preview sits inside a browser canvas, not in a user's hand. A compact
  // desktop-only scale keeps text and controls closer to physical phone size.
  const previewScale = 0.8;

  return (
    <View style={styles.stage}>
      <View style={[styles.device, { height: deviceHeight, width: deviceWidth, transform: [{ scale: previewScale }] }]}>
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
    paddingVertical: 14,
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
