"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@dsc-hunt/ui/lib/utils";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/riddles", label: "Riddles" },
  { href: "/admin/live", label: "Live" },
] as const;

/** Admin tabs with the current one highlighted. Dashboard matches exactly; others by prefix. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4 text-sm text-muted-foreground">
      {NAV_LINKS.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "hover:text-foreground",
              active && "font-medium text-foreground underline underline-offset-8"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
