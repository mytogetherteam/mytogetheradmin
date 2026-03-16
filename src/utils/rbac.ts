export enum AdminRole {
  ADMIN         = 'ADMIN',
  ADMIN_OPS     = 'ADMIN_OPS',
  ADMIN_SETUP   = 'ADMIN_SETUP',
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
export const hasAccess = (userRole: string | undefined, requiredRole: AdminRole | AdminRole[]): boolean => {
  if (!userRole) return false;
  
  // ADMIN is the Super Admin and sees everything
  if (userRole === AdminRole.ADMIN || userRole === 'MASTER_ADMIN') return true;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole as AdminRole);
  }
  
  return userRole === requiredRole;
};
