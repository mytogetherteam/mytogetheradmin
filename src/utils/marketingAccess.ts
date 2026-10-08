import { useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useMarketingStore } from "@/store/useMarketingStore";

export type MarketingAction = "view" | "create" | "edit" | "delete";

export type MarketingSectionPermission = {
  key: string;
  label: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  panelPrefixes: string[];
};

export function isMarketingRole(role: string | undefined | null): boolean {
  return role === "MARKETING" || role === "MarketingAdmin";
}

export function actionForPanelPath(pathname: string): MarketingAction {
  if (/\/create(\/|$)/.test(pathname)) return "create";
  if (pathname.includes("/edit")) return "edit";
  return "view";
}

function matchesPrefix(path: string, prefix: string): boolean {
  if (prefix === "/") return path === "/";
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function sectionForPath(
  pathname: string,
  sections: MarketingSectionPermission[],
): MarketingSectionPermission | undefined {
  let best: MarketingSectionPermission | undefined;
  let bestLength = -1;
  for (const section of sections) {
    for (const prefix of section.panelPrefixes) {
      if (matchesPrefix(pathname, prefix) && prefix.length > bestLength) {
        best = section;
        bestLength = prefix.length;
      }
    }
  }
  return best;
}

export function marketingAllows(
  sections: MarketingSectionPermission[],
  pathname: string,
): boolean {
  if (
    pathname === "/no-access" ||
    pathname === "/profile" ||
    pathname === "/admin/profile"
  ) {
    return true;
  }
  if (pathname.startsWith("/admins/marketing-access")) return false;
  const section = sectionForPath(pathname, sections);
  if (!section) return false;
  const action = actionForPanelPath(pathname);
  if (action === "create") return section.canCreate;
  if (action === "edit") return section.canEdit;
  return section.canView;
}

/** Super Admin always returns true. Marketing Admin follows the section matrix. */
export function useMarketingAction(action: MarketingAction): boolean {
  const role = useAuthStore((s) => s.user?.role);
  const sections = useMarketingStore((s) => s.sections);
  const { pathname } = useLocation();
  if (!isMarketingRole(role)) return true;
  const section = sectionForPath(pathname, sections);
  if (!section) return false;
  if (action === "view") return section.canView;
  if (action === "create") return section.canCreate;
  if (action === "edit") return section.canEdit;
  return section.canDelete;
}
