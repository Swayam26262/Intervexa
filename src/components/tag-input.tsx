"use client";

import { useState } from "react";
import { InputChip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  max = 50,
  className,
}: {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!next.some((t) => t.toLowerCase() === p.toLowerCase())) next.push(p.slice(0, 40));
    }
    onChange(next);
    setDraft("");
  }

  return (
    <div
      className={cn(
        "flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-xl border border-outline px-2 py-2 transition-[border-color,box-shadow] hover:border-on-surface focus-within:border-primary focus-within:shadow-[inset_0_0_0_1px_var(--primary)]",
        className,
      )}
    >
      {value.map((tag) => (
        <InputChip key={tag} onRemove={() => onChange(value.filter((t) => t !== tag))}>
          {tag}
        </InputChip>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (draft.trim()) add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length ? "Add a skill…" : placeholder}
        className="h-8 min-w-28 flex-1 bg-transparent px-2 text-body-lg outline-none placeholder:text-on-surface-variant/70 md:text-body-md"
      />
    </div>
  );
}
