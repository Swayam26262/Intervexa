import { CheckCircle2, CircleAlert, CircleX } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { JdAnalysis, JdSkill } from "@/lib/interview/types";
import { cn } from "@/lib/utils";

const MATCH: Record<JdSkill["match"], { label: string; icon: typeof CheckCircle2; className: string }> = {
  strong: { label: "Strong", icon: CheckCircle2, className: "text-success" },
  partial: { label: "Partial", icon: CircleAlert, className: "text-warning" },
  missing: { label: "Missing", icon: CircleX, className: "text-error" },
};

export function JdMatchView({ analysis, compact }: { analysis: JdAnalysis; compact?: boolean }) {
  const must = analysis.requiredSkills.filter((s) => s.importance === "must");
  const nice = analysis.requiredSkills.filter((s) => s.importance === "nice");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-title-md">
            {analysis.title}
            {analysis.company && <span className="text-on-surface-variant"> · {analysis.company}</span>}
          </div>
          <p className="mt-0.5 text-body-md text-on-surface-variant">
            {analysis.seniority ? `${analysis.seniority} · ` : ""}
            {analysis.summary}
          </p>
        </div>
        <div className="w-44 shrink-0">
          <div className="mb-1.5 flex justify-between text-body-sm">
            <span className="text-on-surface-variant">Skill coverage</span>
            <span className="text-title-sm">{analysis.readiness}%</span>
          </div>
          <Progress value={analysis.readiness} />
        </div>
      </div>
      <div className={cn("grid gap-5", !compact && "md:grid-cols-2")}>
        {[
          ["Required", must],
          ["Nice to have", nice],
        ].map(([label, list]) =>
          (list as JdSkill[]).length ? (
            <div key={label as string}>
              <div className="mb-2 text-label-lg text-on-surface-variant">{label as string}</div>
              <ul className="space-y-1.5">
                {(list as JdSkill[]).map((s) => {
                  const m = MATCH[s.match];
                  const Icon = m.icon;
                  return (
                    <li key={s.name} className="flex items-start gap-2.5 text-body-md" title={s.evidence}>
                      <Icon className={cn("mt-0.5 size-4.5 shrink-0", m.className)} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-on-surface-variant"> — {m.label}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null,
        )}
      </div>
      {analysis.focusAreas.length > 0 && (
        <p className="text-body-md">
          <span className="text-on-surface-variant">Interviews will focus on: </span>
          {analysis.focusAreas.join(", ")}
        </p>
      )}
    </div>
  );
}
