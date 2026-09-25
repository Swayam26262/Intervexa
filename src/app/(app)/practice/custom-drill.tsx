"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CustomDrill() {
  const router = useRouter();
  const [focus, setFocus] = useState("");
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (focus.trim()) router.push(`/interview/new?type=technical&drill=1&focus=${encodeURIComponent(focus.trim())}`);
      }}
    >
      <Input aria-label="Drill topic" value={focus} maxLength={200} onChange={(e) => setFocus(e.target.value)} placeholder="Any topic — e.g. Kafka consumer groups, CAP theorem, STAR stories" />
      <Button type="submit" size="lg" disabled={!focus.trim()} className="shrink-0">
        Set up drill <ArrowRight />
      </Button>
    </form>
  );
}
