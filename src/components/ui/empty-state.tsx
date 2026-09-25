import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      <div className="mb-4 grid size-16 place-items-center rounded-3xl bg-primary-container text-on-primary-container [&_svg]:size-7">
        {icon}
      </div>
      <h3 className="text-title-md">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-body-md text-on-surface-variant">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
