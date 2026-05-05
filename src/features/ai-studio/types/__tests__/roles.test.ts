import { describe, it, expect } from "vitest";
import { isStudioAdminRole, STUDIO_ADMIN_ROLE } from "@/features/ai-studio/types/roles";

describe("studio roles", () => {
  it("STUDIO_ADMIN_ROLE constant equals 'STUDIO_ADMIN'", () => {
    expect(STUDIO_ADMIN_ROLE).toBe("STUDIO_ADMIN");
  });

  it("isStudioAdminRole returns true for STUDIO_ADMIN", () => {
    expect(isStudioAdminRole("STUDIO_ADMIN")).toBe(true);
  });

  it("isStudioAdminRole returns false for CREATOR/BRAND/ADMIN/null/undefined", () => {
    expect(isStudioAdminRole("CREATOR")).toBe(false);
    expect(isStudioAdminRole("BRAND")).toBe(false);
    expect(isStudioAdminRole("ADMIN")).toBe(false);
    expect(isStudioAdminRole(null)).toBe(false);
    expect(isStudioAdminRole(undefined)).toBe(false);
  });
});
