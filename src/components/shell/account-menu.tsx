"use client";

import { useState } from "react";
import { Check, CreditCard, LogOut, Monitor, Moon, Settings, Sun, UserRound } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";
import { Avatar } from "@/components/ui/avatar";
import { Menu, MenuDivider, MenuItem, MenuLabel } from "@/components/ui/menu";
import { applyTheme, type ThemePreference } from "./theme";

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function AccountMenu({
  name,
  email,
  image,
  theme: initialTheme,
}: {
  name: string;
  email: string;
  image?: string | null;
  theme: ThemePreference;
}) {
  const [theme, setTheme] = useState(initialTheme);
  return (
    <Menu
      label="Account"
      trigger={({ open, toggle, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          aria-label="Account and settings"
          className="rounded-full focus-ring"
        >
          <Avatar name={name} image={image} className="size-9 ring-2 ring-transparent transition hover:ring-outline-variant" />
        </button>
      )}
    >
      <div className="flex items-center gap-3 px-4 pt-2 pb-3">
        <Avatar name={name} image={image} className="size-10" />
        <div className="min-w-0">
          <div className="truncate text-title-sm">{name}</div>
          <div className="truncate text-body-sm text-on-surface-variant">{email}</div>
        </div>
      </div>
      <MenuDivider />
      <MenuItem href="/profile">
        <UserRound /> Profile & resumes
      </MenuItem>
      <MenuItem href="/billing">
        <CreditCard /> Plan & billing
      </MenuItem>
      <MenuItem href="/settings">
        <Settings /> Settings
      </MenuItem>
      <MenuDivider />
      <MenuLabel>Theme</MenuLabel>
      {THEMES.map(({ value, label, icon: Icon }) => (
        <MenuItem
          key={value}
          onSelect={() => {
            setTheme(value);
            applyTheme(value);
          }}
        >
          <Icon /> <span className="flex-1">{label}</span>
          {theme === value && <Check className="text-primary!" />}
        </MenuItem>
      ))}
      <MenuDivider />
      <MenuItem onSelect={() => void signOutAction()}>
        <LogOut /> Sign out
      </MenuItem>
    </Menu>
  );
}
