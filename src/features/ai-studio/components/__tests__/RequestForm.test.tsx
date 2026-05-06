import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequestForm } from "@/features/ai-studio/components/RequestForm";

beforeEach(() => {
  global.fetch = vi.fn();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("RequestForm", () => {
  it("disables submit when prompt < 30 chars", () => {
    render(<RequestForm sampleId="s1" targetCategory="EMOTION_STORY" remainingQuota={5} />);
    const submit = screen.getByRole("button", { name: /submit request/i });
    expect(submit).toBeDisabled();
  });

  it("enables submit and posts to /api/studio/requests", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ request: { id: "r1" } }),
    });
    render(<RequestForm sampleId="s1" targetCategory="EMOTION_STORY" remainingQuota={5} />);
    fireEvent.change(screen.getByLabelText(/prompt/i), { target: { value: "A".repeat(40) } });
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const init = (global.fetch as any).mock.calls[0][1];
    expect(JSON.parse(init.body).prompt.length).toBe(40);
  });

  it("shows upgrade CTA when remainingQuota=0", () => {
    render(<RequestForm sampleId="s1" targetCategory="EMOTION_STORY" remainingQuota={0} />);
    expect(screen.getByText(/no requests left/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /upgrade/i })).toBeInTheDocument();
  });
});
