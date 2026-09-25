import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4 pt-4 pb-6", className)}>
      <div className="min-w-0 space-y-1">
        {eyebrow && <div className="text-label-lg text-primary">{eyebrow}</div>}
        <h1 className="text-headline-md sm:text-headline-lg">{title}</h1>
        {description && <p className="max-w-2xl text-body-lg text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-title-lg">{children}</h2>
      {action}
    </div>
  );
}
