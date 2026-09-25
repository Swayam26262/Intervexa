import { AlertTriangle, FolderGit2, ShieldQuestion, TrendingUp } from "lucide-react";
import { AssistChip } from "@/components/ui/chip";
import { Progress } from "@/components/ui/progress";
import type { ResumeAnalysis } from "@/lib/interview/types";

export function ResumeAnalysisView({ analysis }: { analysis: ResumeAnalysis }) {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-surface-container-low p-5">
        <div className="text-title-md">{analysis.headline}</div>
        <p className="mt-1 text-body-md text-on-surface-variant">{analysis.summary}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <SkillBars title="Strong areas" icon={<TrendingUp className="size-4.5 text-primary" />} items={analysis.strongAreas} />
        <SkillBars title="Potential weak areas" icon={<AlertTriangle className="size-4.5 text-warning" />} items={analysis.weakAreas} weak />
      </div>

      {analysis.projects.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-title-sm">
            <FolderGit2 className="size-4.5 text-primary" /> Projects Intervexa will ask about
          </h4>
          <div className="grid gap-3 md:grid-cols-2">
            {analysis.projects.map((p) => (
              <div key={p.name} className="rounded-2xl border border-outline-variant p-4">
                <div className="text-title-sm">{p.name}</div>
                <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">{p.summary}</p>
                {p.technologies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.technologies.slice(0, 6).map((t) => (
                      <AssistChip key={t} className="h-7 text-label-md">
                        {t}
                      </AssistChip>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.claimsToVerify.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-title-sm">
            <ShieldQuestion className="size-4.5 text-primary" /> Resume claims an interviewer will probe
          </h4>
          <ul className="space-y-2">
            {analysis.claimsToVerify.map((c) => (
              <li key={c.claim} className="rounded-2xl bg-surface-container-low p-4">
                <div className="text-body-lg">“{c.claim}”</div>
                {c.followUpQuestions[0] && <div className="mt-1 text-body-sm text-on-surface-variant">Expect: {c.followUpQuestions[0]}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SkillBars({
  title,
  icon,
  items,
  weak,
}: {
  title: string;
  icon: React.ReactNode;
  items: { name: string; score: number; reason?: string }[];
  weak?: boolean;
}) {
  return (
    <div>
      <h4 className="mb-4 flex items-center gap-2 text-title-sm">
        {icon} {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">Nothing detected.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.name}>
              <div className="mb-1.5 flex justify-between text-body-md">
                <span>{item.name}</span>
                <span className="tabular-nums text-on-surface-variant">{item.score}%</span>
              </div>
              <Progress value={item.score} indicatorClassName={weak ? "bg-warning" : "bg-primary"} />
              {weak && item.reason && <p className="mt-1 text-body-sm text-on-surface-variant">{item.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
