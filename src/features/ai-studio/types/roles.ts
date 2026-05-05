export const STUDIO_ADMIN_ROLE = "STUDIO_ADMIN" as const;
export const CREATOR_ROLE = "CREATOR" as const;
export const BRAND_ROLE = "BRAND" as const;
export const PLATFORM_ADMIN_ROLE = "ADMIN" as const;

export type StudioRole =
  | typeof STUDIO_ADMIN_ROLE
  | typeof CREATOR_ROLE
  | typeof BRAND_ROLE
  | typeof PLATFORM_ADMIN_ROLE;

export function isStudioAdminRole(role: string | null | undefined): boolean {
  return role === STUDIO_ADMIN_ROLE;
}
