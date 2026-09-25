import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const bar = (h: number) => ({ width: 12, height: h, borderRadius: 12, background: "white" });
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "linear-gradient(135deg, #5b4bd6, #984061)" }}>
        <div style={bar(28)} />
        <div style={bar(62)} />
        <div style={bar(92)} />
        <div style={bar(52)} />
        <div style={bar(18)} />
      </div>
    ),
    size,
  );
}
