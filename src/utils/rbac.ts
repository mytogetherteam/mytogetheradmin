export enum AdminRole {
  ADMIN = 'ADMIN',
  ADMIN_OPS = 'ADMIN_OPS',
  ADMIN_SETUP = 'ADMIN_SETUP',
  ADMIN_FINANCE = 'ADMIN_FINANCE',
}

/**
 * Checks if the user's role has access to a required role.
 * ADMIN (Super Admin) always has access to everything.
 * 
 * @param userRole The role of the logged-in admin
 * @param requiredRole The role required to access a feature or menu
 * @returns boolean
 */
const operationAdminAccess: readonly AdminRole[] = [
  AdminRole.ADMIN_OPS,
  AdminRole.ADMIN_SETUP,
  AdminRole.ADMIN_FINANCE,
];

export const hasAccess = (userRole: string | undefined, requiredRole: AdminRole | AdminRole[]): boolean => {
  if (!userRole) return false;

  // Super admin (panel or API role name)
  if (
    userRole === AdminRole.ADMIN ||
    userRole === 'MASTER_ADMIN' ||
    userRole === 'SuperAdmin'
  ) {
    return true;
  }

  // API OperationAdmin — ops / setup / finance surfaces, not SuperAdmin-only routes
  if (userRole === 'OperationAdmin') {
    if (Array.isArray(requiredRole)) {
      return requiredRole.some((r) => operationAdminAccess.includes(r));
    }
    return operationAdminAccess.includes(requiredRole);
  }

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole as AdminRole);
  }

  return userRole === requiredRole;
};
