import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingActions } from "@/features/ai-studio/components/BillingActions";

const PLAN_DETAILS = {
  FREE: { name: "Free trial", price: "$0", quota: "1 lifetime trial" },
  STARTER: { name: "Starter", price: "$69 / month", quota: "5 videos / month" },
  PRO: { name: "Pro", price: "$199 / month", quota: "20 videos / month" },
} as const;

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/studio/billing");
  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  const tier = sub?.tier ?? "FREE";
  const details = PLAN_DETAILS[tier];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Billing</p>
        <h1 className="text-3xl font-semibold tracking-tight">Your plan</h1>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">Current plan</p>
            <p className="text-2xl font-semibold">{details.name}</p>
            <p className="text-zinc-300">{details.price}</p>
            <p className="text-xs text-zinc-500">
              Quota: {sub?.quotaUsed ?? 0} / {sub?.quotaLimit ?? 1} used · {details.quota}
            </p>
          </div>
          {sub?.cancelAtPeriodEnd ? (
            <p className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-200">
              Cancels at period end (
              {sub.periodEnd ? new Date(sub.periodEnd).toLocaleDateString() : "—"})
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Upgrade or manage</h2>
        <BillingActions hasStripeCustomer={Boolean(sub?.stripeCustomerId)} />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(["FREE", "STARTER", "PRO"] as const).map((t) => {
          const d = PLAN_DETAILS[t];
          const active = t === tier;
          return (
            <div
              key={t}
              className={`rounded-xl border p-5 ${
                active ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/30"
              }`}
            >
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">{d.name}</p>
              <p className="mt-1 text-2xl font-semibold">{d.price}</p>
              <p className="mt-2 text-sm text-zinc-300">{d.quota}</p>
              {active ? <p className="mt-3 text-xs text-emerald-200">Current plan</p> : null}
            </div>
          );
        })}
      </section>
    </div>
  );
}
