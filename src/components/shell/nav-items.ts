import { BarChart3, History, House, Layers, Target, UserRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Also active for these path prefixes. */
  match?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/practice", label: "Practice", icon: Target },
  { href: "/loops", label: "Loops", icon: Layers },
  { href: "/history", label: "History", icon: History, match: ["/interview/"] },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((i) => i.href !== "/loops");

export function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  return (item.match ?? []).some((m) => pathname.startsWith(m) && !pathname.startsWith("/interview/new"));
}

/** The live interview room is a distraction-free "focus" surface without navigation. */
export function isFocusRoute(pathname: string): boolean {
  return /^\/interview\/(?!new$)[^/]+$/.test(pathname);
}
