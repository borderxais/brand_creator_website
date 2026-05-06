import type { QuotaState } from "@/features/ai-studio/lib/get-quota";

interface QuotaBadgeProps {
  quota: QuotaState;
  className?: string;
}

export function QuotaBadge({ quota, className = "" }: QuotaBadgeProps) {
  const isExhausted = quota.remaining === 0;
  const tone = isExhausted
    ? "bg-amber-500/15 text-amber-200 border-amber-500/30"
    : "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${tone} ${className}`}
      data-testid="quota-badge"
    >
      <span className="font-mono tabular-nums">
        {quota.quotaUsed} / {quota.quotaLimit}
      </span>
      <span className="opacity-70">{quota.tier}</span>
    </div>
  );
}
