import Link from "next/link";
import { AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 text-white shadow-sm">
        <AudioLines className="size-4.5" />
      </span>
      <span className="text-lg">Intervexa</span>
    </Link>
  );
}
