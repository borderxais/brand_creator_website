import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { STUDIO_ADMIN_ROLE } from "@/features/ai-studio/types/roles";

export default async function AdminStudioLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/admin/studio");
  if (session.user.role !== STUDIO_ADMIN_ROLE) notFound();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/admin/studio"
            className="flex items-baseline gap-3 text-lg font-semibold tracking-tight"
          >
            <span>Studio</span>
            <span className="rounded bg-amber-400/10 px-2 py-0.5 text-xs uppercase tracking-widest text-amber-300">
              Admin
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/admin/studio" className="hover:text-zinc-100">
              Dashboard
            </Link>
            <Link href="/admin/studio/samples" className="hover:text-zinc-100">
              Samples
            </Link>
            <Link href="/admin/studio/requests" className="hover:text-zinc-100">
              Queue
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
