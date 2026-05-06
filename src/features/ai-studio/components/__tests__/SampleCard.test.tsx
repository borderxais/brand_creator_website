/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SampleCard } from "@/features/ai-studio/components/SampleCard";

const sample = {
  id: "s1",
  title: "Late-Night Subway",
  category: "EMOTION_STORY",
  hook: "First 3s: stranger reads the same poem on the wall every night",
  thumbnailUrl: "/test-thumb.jpg",
  durationSec: 90,
};

describe("SampleCard", () => {
  it("renders title, category, and hook", () => {
    render(<SampleCard sample={sample as any} />);
    expect(screen.getByText("Late-Night Subway")).toBeInTheDocument();
    expect(screen.getByText(/EMOTION_STORY/)).toBeInTheDocument();
    expect(screen.getByText(/First 3s/)).toBeInTheDocument();
  });

  it("links to /studio/samples/[id]", () => {
    const { container } = render(<SampleCard sample={sample as any} />);
    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "/studio/samples/s1");
  });
});
