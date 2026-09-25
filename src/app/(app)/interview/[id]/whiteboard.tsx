"use client";

import "@excalidraw/excalidraw/index.css";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { summarizeDiagram, type DiagramElement } from "@/lib/diagram";

declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string | string[];
  }
}
if (typeof window !== "undefined") window.EXCALIDRAW_ASSET_PATH = "/excalidraw-assets/";

const Excalidraw = dynamic(async () => (await import("@excalidraw/excalidraw")).Excalidraw, {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-body-md text-on-surface-variant">
      <span className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" /> Loading whiteboard…
      </span>
    </div>
  ),
});

function useResolvedTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const read = () => {
      const forced = document.documentElement.dataset.theme;
      setTheme(forced === "dark" || (forced !== "light" && media.matches) ? "dark" : "light");
    };
    read();
    media.addEventListener("change", read);
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      media.removeEventListener("change", read);
      observer.disconnect();
    };
  }, []);
  return theme;
}

/**
 * Excalidraw whiteboard. Reports a text summary of the diagram (components, connections, notes)
 * so it can be attached to answers; the scene is kept in localStorage per interview.
 */
export function Whiteboard({ storageKey, onSummary }: { storageKey: string; onSummary: (summary: string) => void }) {
  const theme = useResolvedTheme();
  const lastSummary = useRef("");
  const [initial] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { elements: JSON.parse(saved), scrollToContent: true } : null;
    } catch {
      return null;
    }
  });

  return (
    <div className="h-full min-h-[420px] overflow-hidden rounded-3xl border border-outline-variant [&_.excalidraw]:rounded-3xl">
      <Excalidraw
        theme={theme}
        initialData={initial}
        UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: false, saveAsImage: true } }}
        onChange={(elements) => {
          const list = elements as unknown as DiagramElement[];
          const summary = summarizeDiagram(list);
          if (summary !== lastSummary.current) {
            lastSummary.current = summary;
            onSummary(summary);
            try {
              localStorage.setItem(storageKey, JSON.stringify(elements.filter((e) => !e.isDeleted)));
            } catch {
              /* storage full or unavailable */
            }
          }
        }}
      />
    </div>
  );
}
