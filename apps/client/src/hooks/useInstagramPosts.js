import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { instagramPostsApi, translationApi } from '../api';
import { queryKeys } from '../api/queryKeys';

function buildInstagramParams(filters) {
  const params = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.category) params.category = filters.category;
  if (filters?.tag) params.tag = filters.tag;
  if (filters?.instagram_feed_id) params.instagram_feed_id = filters.instagram_feed_id;
  return params;
}

export function useInstagramPostsList(filters) {
  return useQuery({
    queryKey: queryKeys.instagramPostsList(filters),
    queryFn: () => instagramPostsApi.getAll(buildInstagramParams(filters)),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteInstagramPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => instagramPostsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['instagramPosts', 'list'] });
      const previous = queryClient.getQueriesData({ queryKey: ['instagramPosts', 'list'] });

      queryClient.setQueriesData({ queryKey: ['instagramPosts', 'list'] }, (old) =>
        Array.isArray(old) ? old.filter((item) => item.id !== id) : old
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (!context?.previous) return;
      context.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['instagramPosts', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useTranslateInstagramPosts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filters) => translationApi.translateInstagramPosts(filters || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagramPosts', 'list'] });
    },
  });
}
