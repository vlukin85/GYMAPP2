import Svg, { Circle, Path, Rect, type SvgProps } from "react-native-svg";
import type { OpaqueColorValue, StyleProp, ViewStyle } from "react-native";
import { useSvgIconTheme } from "@/lib/svg-icon-theme";

export type WebSvgIconName =
  | "add-circle"
  | "arrow-forward"
  | "auto-awesome"
  | "calendar"
  | "chart"
  | "check"
  | "check-circle"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "code"
  | "delete"
  | "drag-handle"
  | "dumbbell"
  | "gear"
  | "home"
  | "lightbulb"
  | "list"
  | "move"
  | "play"
  | "refresh"
  | "send"
  | "south"
  | "storage"
  | "timer"
  | "trophy";

type WebSvgIconProps = {
  name: WebSvgIconName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
};

/** Inline SVG icon set for browser preview: crisp at every scale and free of font loading. */
export function WebSvgIcon({ name, size = 24, color, style }: WebSvgIconProps) {
  const { theme } = useSvgIconTheme();
  const effectiveColor = color === "#7C3AED" ? theme.color : color;
  const stroke: Pick<SvgProps, "stroke" | "strokeWidth" | "strokeLinecap" | "strokeLinejoin"> = {
    stroke: effectiveColor,
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const artwork = (() => {
    switch (name) {
      case "home":
        return <><Path {...stroke} d="m3 10.8 9-7.3 9 7.3V21H3z" /><Path {...stroke} d="M9 21v-6h6v6" /></>;
      case "send":
        return <><Path {...stroke} d="m3.5 4 17 8-17 8 3-8z" /><Path {...stroke} d="M6.5 12h11" /></>;
      case "code":
        return <><Path {...stroke} d="m8.2 7-5 5 5 5M15.8 7l5 5-5 5M13.5 4.5l-3 15" /></>;
      case "chevron-right":
        return <Path {...stroke} d="m9 5 7 7-7 7" />;
      case "chevron-left":
        return <Path {...stroke} d="m15 5-7 7 7 7" />;
      case "chevron-down":
        return <Path {...stroke} d="m5 9 7 7 7-7" />;
      case "dumbbell":
        return <><Path {...stroke} d="m7 8-2-2-2 2 2 2m12-2 2-2 2 2-2 2M7 16l-2 2-2-2 2-2m12 2 2 2 2-2-2-2M7 9l10 6M7 15l10-6" /></>;
      case "list":
        return <><Circle {...stroke} cx="5" cy="6" r=".8" fill={effectiveColor} /><Circle {...stroke} cx="5" cy="12" r=".8" fill={effectiveColor} /><Circle {...stroke} cx="5" cy="18" r=".8" fill={effectiveColor} /><Path {...stroke} d="M9 6h10M9 12h10M9 18h10" /></>;
      case "chart":
        return <><Path {...stroke} d="M4 20V10M10 20V4M16 20v-7M22 20H2" /><Rect x="3" y="10" width="2" height="10" rx="1" fill={effectiveColor} /><Rect x="9" y="4" width="2" height="16" rx="1" fill={effectiveColor} /><Rect x="15" y="13" width="2" height="7" rx="1" fill={effectiveColor} /></>;
      case "calendar":
        return <><Rect {...stroke} x="3" y="5" width="18" height="16" rx="3" /><Path {...stroke} d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>;
      case "arrow-forward":
        return <><Path {...stroke} d="M4 12h15M14 6l6 6-6 6" /></>;
      case "lightbulb":
        return <><Path {...stroke} d="M8.5 18h7M9.5 21h5M8 14.5C6.7 13.4 6 11.8 6 10a6 6 0 0 1 12 0c0 1.8-.7 3.4-2 4.5-.7.6-1 1.1-1 2H9c0-.9-.3-1.4-1-2Z" /><Path {...stroke} d="M12 2v1M4.9 4.9l.8.8M19.1 4.9l-.8.8" /></>;
      case "timer":
        return <><Circle {...stroke} cx="12" cy="13" r="8" /><Path {...stroke} d="M9 2h6M12 5V2M12 9v4l3 2" /></>;
      case "trophy":
        return <><Path {...stroke} d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 21h8M9 18h6" /></>;
      case "play":
        return <><Circle {...stroke} cx="12" cy="12" r="9" /><Path d="m10 8 6 4-6 4z" fill={effectiveColor} /></>;
      case "check":
        return <Path {...stroke} strokeWidth={2.3} d="m5 12 4.2 4.2L19 6.7" />;
      case "check-circle":
        return <><Circle {...stroke} cx="12" cy="12" r="9" /><Path {...stroke} strokeWidth={2.2} d="m7.5 12 3 3 6-6" /></>;
      case "gear":
        return <><Circle {...stroke} cx="12" cy="12" r="3" /><Path {...stroke} d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.3 1a8 8 0 0 0-1.7-1L14.6 3h-5.2L9.1 6a8 8 0 0 0-1.7 1l-2.3-1-2 3.4L5.1 11a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.3-1a8 8 0 0 0 1.7 1l.3 3h5.2l.3-3a8 8 0 0 0 1.7-1l2.3 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" /></>;
      case "add-circle":
        return <><Circle {...stroke} cx="12" cy="12" r="9" /><Path {...stroke} d="M12 8v8M8 12h8" /></>;
      case "auto-awesome":
        return <><Path {...stroke} d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4zM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7zM5 15l.7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7z" /></>;
      case "delete":
        return <><Path {...stroke} d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></>;
      case "drag-handle":
        return <><Circle fill={effectiveColor} cx="8" cy="6" r="1.2" /><Circle fill={effectiveColor} cx="16" cy="6" r="1.2" /><Circle fill={effectiveColor} cx="8" cy="12" r="1.2" /><Circle fill={effectiveColor} cx="16" cy="12" r="1.2" /><Circle fill={effectiveColor} cx="8" cy="18" r="1.2" /><Circle fill={effectiveColor} cx="16" cy="18" r="1.2" /></>;
      case "move":
        return <><Path {...stroke} d="M12 3v18M3 12h18M12 3 9 6m3-3 3 3M12 21l-3-3m3 3 3-3M3 12l3-3m-3 3 3 3M21 12l-3-3m3 3-3 3" /></>;
      case "refresh":
        return <><Path {...stroke} d="M20 11a8 8 0 0 0-14.5-4.7L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.7L20 16M20 20v-4h-4" /></>;
      case "south":
        return <Path {...stroke} d="M12 4v15M6 14l6 6 6-6" />;
      case "storage":
        return <><Rect {...stroke} x="4" y="3" width="16" height="18" rx="2" /><Path {...stroke} d="M4 8h16M8 12h8M8 16h5" /></>;
      default:
        return null;
    }
  })();

  return (
    <Svg accessibilityRole="image" width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {artwork}
    </Svg>
  );
}
