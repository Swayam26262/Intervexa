/** Minimal shape of whiteboard elements we read (compatible with Excalidraw's element JSON). */
export interface DiagramElement {
  id: string;
  type: string;
  isDeleted?: boolean;
  text?: string;
  containerId?: string | null;
  startBinding?: { elementId: string } | null;
  endBinding?: { elementId: string } | null;
  x?: number;
  y?: number;
}

const SHAPES = new Set(["rectangle", "ellipse", "diamond", "frame"]);

/**
 * Turns a whiteboard into plain text the interviewer can reason about:
 * "Components: Client, API, Postgres. Connections: Client → API; API → Postgres (writes)."
 */
export function summarizeDiagram(elements: readonly DiagramElement[]): string {
  const live = elements.filter((e) => !e.isDeleted);
  const byId = new Map(live.map((e) => [e.id, e]));
  const boundText = new Map<string, string>();
  for (const e of live) {
    if (e.type === "text" && e.containerId && e.text?.trim()) boundText.set(e.containerId, e.text.trim().replace(/\s+/g, " "));
  }
  const labelOf = (id: string | undefined | null) => {
    if (!id) return null;
    const el = byId.get(id);
    if (!el) return null;
    return boundText.get(id) ?? `${el.type} ${id.slice(0, 4)}`;
  };

  const components = live
    .filter((e) => SHAPES.has(e.type))
    .sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0))
    .map((e) => boundText.get(e.id) ?? "(unlabelled box)");
  const connections = live
    .filter((e) => e.type === "arrow" || e.type === "line")
    .map((e) => {
      const from = labelOf(e.startBinding?.elementId);
      const to = labelOf(e.endBinding?.elementId);
      const label = boundText.get(e.id);
      if (!from && !to) return label ? `(unconnected arrow: ${label})` : null;
      return `${from ?? "?"} → ${to ?? "?"}${label ? ` (${label})` : ""}`;
    })
    .filter((c): c is string => Boolean(c));
  const notes = live
    .filter((e) => e.type === "text" && !e.containerId && e.text?.trim())
    .map((e) => e.text!.trim().replace(/\s+/g, " "));

  const parts: string[] = [];
  if (components.length) parts.push(`Components: ${components.join(", ")}.`);
  if (connections.length) parts.push(`Connections: ${connections.join("; ")}.`);
  if (notes.length) parts.push(`Notes: ${notes.join(" | ")}.`);
  return parts.join(" ").slice(0, 3500);
}
