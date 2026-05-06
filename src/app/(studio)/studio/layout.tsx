import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getQuotaForUser } from "@/features/ai-studio/lib/get-quota";
import { QuotaBadge } from "@/features/ai-studio/components/QuotaBadge";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/studio");
  const quota = await getQuotaForUser(session.user.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/studio" className="text-lg font-semibold tracking-tight">
            Studio
          </Link>
          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/studio/samples" className="hover:text-zinc-100">
              Browse
            </Link>
            <Link href="/studio/requests" className="hover:text-zinc-100">
              My videos
            </Link>
            <Link href="/studio/billing" className="hover:text-zinc-100">
              Billing
            </Link>
            <QuotaBadge quota={quota} />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
