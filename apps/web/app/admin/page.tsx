import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">DSC Hunt admin</h1>
      <p className="text-sm text-muted-foreground">
        You have staff access. Admin tools will live here.
      </p>
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to site
      </Link>
    </main>
  );
}
