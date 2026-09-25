"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { ProDialog } from "@/components/pro-dialog";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedButton } from "@/components/ui/segmented";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { DIFFICULTIES, DIFFICULTY_META, type Difficulty } from "@/lib/interview/config";

export function NewLoopForm({ packs, disclaimer, locked }: { packs: { id: string; label: string; blurb: string }[]; disclaimer: string; locked: boolean }) {
  const router = useRouter();
  const [jobDescription, setJd] = useState("");
  const [role, setRole] = useState("");
  const [packId, setPackId] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [pending, setPending] = useState(false);
  const [upsell, setUpsell] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (locked) {
      setUpsell("Full mock loops are part of Pro.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/loops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, role: role || undefined, packId: packId || undefined, difficulty }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 402) {
        setUpsell(data?.error ?? "Full mock loops are part of Pro.");
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? "Could not create the loop.");
      router.push(`/loops/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the loop.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={create} className="space-y-5">
      <div>
        <Label htmlFor="jd" className="mb-2">
          Job description
        </Label>
        <Textarea
          id="jd"
          rows={8}
          required
          minLength={80}
          maxLength={12000}
          value={jobDescription}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the full job description — responsibilities, requirements and nice-to-haves."
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="loop-role" className="mb-2">
            Role title <span className="font-normal text-on-surface-variant">(optional — we&apos;ll read it from the JD)</span>
          </Label>
          <Input id="loop-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. AI Engineer" />
        </div>
        <div>
          <Label className="mb-2">Difficulty</Label>
          <SegmentedButton ariaLabel="Difficulty" value={difficulty} onChange={setDifficulty} options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_META[d].label }))} />
        </div>
      </div>
      <div>
        <div className="mb-2 text-label-lg">Interview style</div>
        <div className="flex flex-wrap gap-2">
          <FilterChip selected={!packId} onClick={() => setPackId("")}>
            Built from the JD
          </FilterChip>
          {packs.map((p) => (
            <FilterChip key={p.id} selected={packId === p.id} title={p.blurb} onClick={() => setPackId(packId === p.id ? "" : p.id)}>
              {p.label}
            </FilterChip>
          ))}
        </div>
        <p className="mt-2 text-body-sm text-on-surface-variant">{disclaimer}</p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending || jobDescription.trim().length < 80}>
          {pending ? <Loader2 className="animate-spin" /> : <Wand2 />} {pending ? "Building your loop…" : "Build my loop"}
        </Button>
      </div>
      <ProDialog open={upsell !== null} onOpenChange={(o) => !o && setUpsell(null)} message={upsell ?? ""} />
    </form>
  );
}
