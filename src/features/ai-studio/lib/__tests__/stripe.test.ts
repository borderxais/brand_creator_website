import { describe, it, expect, afterEach, vi } from "vitest";

describe("stripe wrapper", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
    vi.resetModules();
  });

  it("priceIdForTier returns the env-configured ID", async () => {
    (process.env as Record<string, string | undefined>).STRIPE_PRICE_STARTER = "price_starter_test";
    (process.env as Record<string, string | undefined>).STRIPE_PRICE_PRO = "price_pro_test";
    (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY = "sk_test_x";
    const mod = await import("@/features/ai-studio/lib/stripe");
    expect(mod.priceIdForTier("STARTER")).toBe("price_starter_test");
    expect(mod.priceIdForTier("PRO")).toBe("price_pro_test");
  });

  it("priceIdForTier throws for FREE tier", async () => {
    (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY = "sk_test_x";
    const mod = await import("@/features/ai-studio/lib/stripe");
    expect(() => mod.priceIdForTier("FREE")).toThrow(/no price/i);
  });

  it("priceIdForTier throws when env var unset", async () => {
    (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY = "sk_test_x";
    delete (process.env as Record<string, string | undefined>).STRIPE_PRICE_STARTER;
    const mod = await import("@/features/ai-studio/lib/stripe");
    expect(() => mod.priceIdForTier("STARTER")).toThrow(/STRIPE_PRICE_STARTER/);
  });

  it("tierForPriceId returns matching tier", async () => {
    (process.env as Record<string, string | undefined>).STRIPE_PRICE_STARTER = "price_starter_test";
    (process.env as Record<string, string | undefined>).STRIPE_PRICE_PRO = "price_pro_test";
    (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY = "sk_test_x";
    const mod = await import("@/features/ai-studio/lib/stripe");
    expect(mod.tierForPriceId("price_starter_test")).toBe("STARTER");
    expect(mod.tierForPriceId("price_pro_test")).toBe("PRO");
    expect(mod.tierForPriceId("price_unknown")).toBe(null);
  });

  it("quotaLimitForTier returns spec'd limits", async () => {
    (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY = "sk_test_x";
    const mod = await import("@/features/ai-studio/lib/stripe");
    expect(mod.quotaLimitForTier("FREE")).toBe(1);
    expect(mod.quotaLimitForTier("STARTER")).toBe(5);
    expect(mod.quotaLimitForTier("PRO")).toBe(20);
  });
});
