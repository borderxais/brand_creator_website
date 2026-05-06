/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/features/ai-studio/components/StatusBadge";

describe("StatusBadge", () => {
  it.each([
    ["PENDING", /pending/i],
    ["IN_PROGRESS", /in progress/i],
    ["DELIVERED", /delivered/i],
    ["REJECTED", /rejected/i],
    ["FAILED", /failed/i],
  ] as const)("renders %s with human label", (status, expected) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
