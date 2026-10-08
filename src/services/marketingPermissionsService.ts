import { api } from "@/utils/axios";
import { useMarketingStore } from "@/store/useMarketingStore";
import type { MarketingSectionPermission } from "@/utils/marketingAccess";

function unwrap(body: unknown): MarketingSectionPermission[] {
  const payload =
    body && typeof body === "object" && "data" in body
      ? (body as { data: unknown }).data
      : body;
  return Array.isArray(payload) ? (payload as MarketingSectionPermission[]) : [];
}

export const marketingPermissionsService = {
  async loadMine(): Promise<MarketingSectionPermission[]> {
    const { data } = await api.get("/api/admin/marketing-permissions/me");
    const sections = unwrap(data);
    useMarketingStore.getState().setSections(sections);
    return sections;
  },

  async list(): Promise<MarketingSectionPermission[]> {
    const { data } = await api.get("/api/admin/marketing-permissions");
    return unwrap(data);
  },

  async save(sections: MarketingSectionPermission[]): Promise<MarketingSectionPermission[]> {
    const { data } = await api.put("/api/admin/marketing-permissions", {
      sections: sections.map((section) => ({
        section: section.key,
        canView: section.canView,
        canCreate: section.canCreate,
        canEdit: section.canEdit,
        canDelete: section.canDelete,
      })),
    });
    return unwrap(data);
  },
};
