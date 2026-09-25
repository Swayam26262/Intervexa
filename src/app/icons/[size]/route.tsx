import { ImageResponse } from "next/og";

export const dynamic = "force-static";

const SIZES: Record<string, { size: number; maskable: boolean }> = {
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  "512-maskable": { size: 512, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

/** App icons generated at build time: the soundwave mark on the brand gradient. */
export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const spec = SIZES[(await params).size] ?? SIZES["192"];
  const s = spec.size;
  const inset = spec.maskable ? s * 0.2 : s * 0.12;
  const bar = (h: number) => ({ width: s * 0.065, height: s * h, borderRadius: s, background: "white" });
  return new ImageResponse(
    (
      <div
        style={{
          width: s,
          height: s,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #5b4bd6, #984061)",
          borderRadius: spec.maskable ? 0 : s * 0.22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: s * 0.05, padding: inset }}>
          <div style={bar(0.16)} />
          <div style={bar(0.34)} />
          <div style={bar(0.5)} />
          <div style={bar(0.28)} />
          <div style={bar(0.1)} />
        </div>
      </div>
    ),
    { width: s, height: s },
  );
}
