import { Briefcase, Code2, Cpu, FolderSearch, Handshake, Network, type LucideIcon } from "lucide-react";
import type { InterviewType } from "@/lib/interview/config";
import { cn } from "@/lib/utils";

export const TYPE_ICON: Record<InterviewType, LucideIcon> = {
  technical: Cpu,
  coding: Code2,
  system_design: Network,
  project_deep_dive: FolderSearch,
  behavioral: Handshake,
  hr: Briefcase,
};

/** Tonal color pairs per round type, so lists are scannable at a glance. */
export const TYPE_TONE: Record<InterviewType, string> = {
  technical: "bg-primary-container text-on-primary-container",
  coding: "bg-secondary-container text-on-secondary-container",
  system_design: "bg-tertiary-container text-on-tertiary-container",
  project_deep_dive: "bg-success-container text-on-success-container",
  behavioral: "bg-warning-container text-on-warning-container",
  hr: "bg-surface-container-highest text-on-surface-variant",
};

export function TypeIcon({ type, className, size = "md" }: { type: InterviewType; className?: string; size?: "sm" | "md" | "lg" }) {
  const Icon = TYPE_ICON[type];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center",
        size === "sm" && "size-8 rounded-lg [&_svg]:size-4",
        size === "md" && "size-10 rounded-xl [&_svg]:size-5",
        size === "lg" && "size-12 rounded-2xl [&_svg]:size-6",
        TYPE_TONE[type],
        className,
      )}
      aria-hidden
    >
      <Icon />
    </span>
  );
}
