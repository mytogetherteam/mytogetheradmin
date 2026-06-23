import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NewsService } from "@/services/newsService";
import { toast } from "sonner";
import { handleApiError } from "@/lib/error-utils";
import { useNavigate } from "react-router-dom";

export const newsKeys = {
  all: ["news"] as const,
};

export function useNewsList(params?: {
  page?: number;
  size?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: [...newsKeys.all, params],
    queryFn: () => NewsService.getNews(params),
  });
}

export function useNewsItem(id: number) {
  return useQuery({
    queryKey: [...newsKeys.all, id],
    queryFn: () => NewsService.getNewsById(id),
    enabled: !!id,
  });
}

export function useCreateNewsMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => NewsService.createNews(data),
    onSuccess: () => {
      toast.success("News created successfully");
      void queryClient.invalidateQueries({ queryKey: newsKeys.all });
      navigate("/news/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to create news");
    },
  });
}

export function useUpdateNewsMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      NewsService.updateNews(id, data),
    onSuccess: () => {
      toast.success("News updated successfully");
      void queryClient.invalidateQueries({ queryKey: newsKeys.all });
      navigate("/news/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to update news");
    },
  });
}

export function useDeleteNewsMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => NewsService.deleteNews(id),
    onSuccess: () => {
      toast.success("News deleted successfully");
      void queryClient.invalidateQueries({ queryKey: newsKeys.all });
      navigate("/news/manage");
    },
    onError: (error) => {
      handleApiError(error, "Failed to delete news");
    },
  });
}
