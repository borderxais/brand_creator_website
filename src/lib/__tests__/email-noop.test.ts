import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn(async () => {
        throw new Error("real transport must not be called when noop=1");
      }),
    }),
  },
}));

import { sendEmail } from "@/lib/email";

describe("sendEmail with EMAIL_DEV_NOOP", () => {
  const original = process.env.EMAIL_DEV_NOOP;
  afterEach(() => {
    (process.env as Record<string, string | undefined>).EMAIL_DEV_NOOP = original;
  });

  it("returns ok:true and skips transport when EMAIL_DEV_NOOP=1", async () => {
    (process.env as Record<string, string | undefined>).EMAIL_DEV_NOOP = "1";
    const result = await sendEmail({
      to: "x@test.local",
      subject: "hi",
      html: "<p>hi</p>",
    });
    expect(result).toMatchObject({ ok: true, noop: true });
  });
});
