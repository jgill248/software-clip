import { PERMISSION_KEYS } from "@softclipai/shared";
import type { HumanProductMembershipRole } from "@softclipai/shared";

const HUMAN_PRODUCT_MEMBERSHIP_ROLES: HumanProductMembershipRole[] = [
  "owner",
  "admin",
  "operator",
  "viewer",
];

export function normalizeHumanRole(
  value: unknown,
  fallback: HumanProductMembershipRole = "operator"
): HumanProductMembershipRole {
  if (value === "member") return "operator";
  return HUMAN_PRODUCT_MEMBERSHIP_ROLES.includes(value as HumanProductMembershipRole)
    ? (value as HumanProductMembershipRole)
    : fallback;
}

export function grantsForHumanRole(
  role: HumanProductMembershipRole
): Array<{
  permissionKey: (typeof PERMISSION_KEYS)[number];
  scope: Record<string, unknown> | null;
}> {
  switch (role) {
    case "owner":
      return [
        { permissionKey: "agents:create", scope: null },
        { permissionKey: "users:invite", scope: null },
        { permissionKey: "users:manage_permissions", scope: null },
        { permissionKey: "tasks:assign", scope: null },
        { permissionKey: "joins:approve", scope: null },
      ];
    case "admin":
      return [
        { permissionKey: "agents:create", scope: null },
        { permissionKey: "users:invite", scope: null },
        { permissionKey: "tasks:assign", scope: null },
        { permissionKey: "joins:approve", scope: null },
      ];
    case "operator":
      return [{ permissionKey: "tasks:assign", scope: null }];
    case "viewer":
      return [];
  }
}

export function resolveHumanInviteRole(
  defaultsPayload: Record<string, unknown> | null | undefined
): HumanProductMembershipRole {
  if (!defaultsPayload || typeof defaultsPayload !== "object") return "operator";
  const scoped = defaultsPayload.human;
  if (!scoped || typeof scoped !== "object" || Array.isArray(scoped)) {
    return "operator";
  }
  return normalizeHumanRole((scoped as Record<string, unknown>).role, "operator");
}
