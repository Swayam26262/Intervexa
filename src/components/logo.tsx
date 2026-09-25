import Link from "next/link";
import { cn } from "@/lib/utils";

/** Brand mark: a soundwave in a squircle, primary → tertiary. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 place-items-center rounded-[12px] bg-[linear-gradient(135deg,var(--primary),color-mix(in_oklab,var(--primary)_40%,var(--tertiary)))] text-white shadow-sm",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />
      </svg>
    </span>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 rounded-lg focus-ring", className)}>
      <LogoMark />
      <span className="text-title-lg tracking-tight">Intervexa</span>
    </Link>
  );
}
