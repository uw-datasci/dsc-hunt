import Link from "next/link";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/riddles", label: "Riddles" },
  { href: "/admin/live", label: "Live" },
] as const;

interface AdminShellProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({ title, actions, children }: Readonly<AdminShellProps>) {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/admin" className="font-heading text-lg tracking-wide text-primary">
              DSC Hunt admin
            </Link>
            {/* TODO: highlight the active tab (needs usePathname in a client nav). */}
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl">{title}</h1>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
