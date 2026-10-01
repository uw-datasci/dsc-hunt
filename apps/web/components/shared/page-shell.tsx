import { cn } from "@dsc-hunt/ui/lib/utils";

interface PageShellProps {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  /** Tailwind max-width class for the content column. */
  width?: "max-w-lg" | "max-w-2xl" | "max-w-3xl";
  children?: React.ReactNode;
}

/** Centered single-column page used by the player-facing screens. */
export function PageShell({
  title,
  eyebrow,
  description,
  width = "max-w-lg",
  children,
}: Readonly<PageShellProps>) {
  return (
    <main
      className={cn("mx-auto flex min-h-svh flex-col justify-center gap-8 px-6 py-16", width)}
    >
      <header className="text-center">
        {eyebrow ? (
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-4xl text-primary sm:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </main>
  );
}
