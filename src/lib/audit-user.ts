export interface AdminAuditUser {
  id: number;
  name?: string | null;
  username?: string | null;
  email: string;
  profileUrl?: string | null;
}

export function adminAuditUserLabel(user?: AdminAuditUser | null): string {
  if (!user) return "—";
  return user.name?.trim() || user.username?.trim() || user.email;
}
