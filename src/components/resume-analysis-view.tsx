import { AlertTriangle, FolderGit2, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ResumeAnalysis } from "@/lib/interview/types";
import { scoreBarTone } from "@/lib/utils";

export function ResumeAnalysisView({ analysis }: { analysis: ResumeAnalysis }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="font-medium">{analysis.headline}</div>
        <p className="mt-1 text-sm text-muted-foreground">{analysis.summary}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SkillBars title="Strong areas" items={analysis.strongAreas} />
        <SkillBars title="Potential weak areas" items={analysis.weakAreas} weak />
      </div>

      {analysis.projects.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <FolderGit2 className="size-4 text-primary" /> Projects Intervexa will ask about
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {analysis.projects.map((p) => (
              <div key={p.name} className="rounded-lg border p-3">
                <div className="text-sm font-medium">{p.name}</div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{p.summary}</p>
                {p.technologies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.technologies.slice(0, 6).map((t) => (
                      <Badge key={t} variant="outline" className="font-normal">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.claimsToVerify.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldQuestion className="size-4 text-primary" /> Resume claims an interviewer will probe
          </h3>
          <ul className="space-y-2">
            {analysis.claimsToVerify.map((c) => (
              <li key={c.claim} className="rounded-lg bg-muted/60 p-3 text-sm">
                <div className="font-medium">“{c.claim}”</div>
                {c.followUpQuestions[0] && (
                  <div className="mt-1 text-xs text-muted-foreground">→ {c.followUpQuestions[0]}</div>
                )}
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
  items,
  weak,
}: {
  title: string;
  items: { name: string; score: number; reason?: string }[];
  weak?: boolean;
}) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {weak && <AlertTriangle className="size-4 text-warning" />} {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing detected.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.name} title={item.reason}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium">{item.name}</span>
                <span className="tabular-nums text-muted-foreground">{item.score}%</span>
              </div>
              <Progress value={item.score} indicatorClassName={scoreBarTone(item.score)} />
              {weak && item.reason && <p className="mt-1 text-[11px] text-muted-foreground">{item.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
