import { config } from "@/config/config";
import { handleApiCall } from "@/lib/handleApiCall";
import { api } from "@/utils/axios";

export interface SocialReaction {
  id: number;
  key: string;
  emoji: string;
  labelEn: string;
  labelMm: string | null;
  labelTh: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  displayPx: number;
  filePx: number;
}

export interface SocialReactionUpdate {
  labelEn: string;
  labelMm: string;
  labelTh: string;
  isActive: boolean;
  sortOrder: number;
  image?: File | null;
  clearImage?: boolean;
}

export const socialReactionService = {
  list: async (): Promise<SocialReaction[]> => {
    return handleApiCall<SocialReaction[]>(() =>
      api.get(config.endpoints.admin.socialReactions.base),
    );
  },

  update: async (id: number, payload: SocialReactionUpdate): Promise<SocialReaction> => {
    const form = new FormData();
    form.append("labelEn", payload.labelEn);
    form.append("labelMm", payload.labelMm);
    form.append("labelTh", payload.labelTh);
    form.append("isActive", String(payload.isActive));
    form.append("sortOrder", String(payload.sortOrder));
    if (payload.clearImage) form.append("clearImage", "true");
    if (payload.image) form.append("image", payload.image);
    return handleApiCall<SocialReaction>(() =>
      api.put(config.endpoints.admin.socialReactions.detail(id), form),
    );
  },
};
