"use client";

import { useState } from "react";

interface BillingActionsProps {
  hasStripeCustomer: boolean;
}

export function BillingActions({ hasStripeCustomer }: BillingActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(tier: "STARTER" | "PRO") {
    setError(null);
    setLoading(tier);
    try {
      const res = await fetch("/api/studio/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const body = await res.json();
      if (!res.ok || !body.url) {
        setError(body.error ?? "Checkout failed");
        return;
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    setError(null);
    setLoading("PORTAL");
    try {
      const res = await fetch("/api/studio/billing/portal", { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.url) {
        setError(body.error ?? "Portal unavailable");
        return;
      }
      window.location.href = body.url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => startCheckout("STARTER")}
          disabled={loading !== null}
          className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:opacity-50"
        >
          {loading === "STARTER" ? "Redirecting…" : "Upgrade to Starter ($69/mo)"}
        </button>
        <button
          onClick={() => startCheckout("PRO")}
          disabled={loading !== null}
          className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          {loading === "PRO" ? "Redirecting…" : "Upgrade to Pro ($199/mo)"}
        </button>
        {hasStripeCustomer ? (
          <button
            onClick={openPortal}
            disabled={loading !== null}
            className="rounded-full border border-zinc-700 px-5 py-2 text-sm text-zinc-300 hover:border-zinc-500 disabled:opacity-50"
          >
            {loading === "PORTAL" ? "Opening…" : "Manage subscription"}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
