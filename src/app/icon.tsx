import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const bar = (h: number) => ({ width: 5, height: h, borderRadius: 5, background: "white" });
  return new ImageResponse(
    (
      <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, background: "linear-gradient(135deg, #5b4bd6, #984061)", borderRadius: 16 }}>
        <div style={bar(12)} />
        <div style={bar(24)} />
        <div style={bar(34)} />
        <div style={bar(20)} />
        <div style={bar(8)} />
      </div>
    ),
    size,
  );
}
