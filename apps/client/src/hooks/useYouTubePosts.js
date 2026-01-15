import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { youtubePostsApi } from '../api';
import { queryKeys } from '../api/queryKeys';

function buildYouTubeParams(filters) {
  const params = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.category) params.category = filters.category;
  if (filters?.youtube_feed_id) params.youtube_feed_id = filters.youtube_feed_id;
  if (filters?.limit != null && filters.limit !== '') params.limit = filters.limit;
  if (filters?.offset != null && filters.offset !== '') params.offset = filters.offset;
  return params;
}

export function useYouTubePostsList(filters) {
  return useQuery({
    queryKey: queryKeys.youtubePostsList(filters),
    queryFn: () => youtubePostsApi.getAll(buildYouTubeParams(filters)),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteYouTubePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => youtubePostsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['youtubePosts', 'list'] });
      const previous = queryClient.getQueriesData({ queryKey: ['youtubePosts', 'list'] });

      queryClient.setQueriesData({ queryKey: ['youtubePosts', 'list'] }, (old) =>
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
      queryClient.invalidateQueries({ queryKey: ['youtubePosts', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useYouTubeTranscript(postId) {
  return useQuery({
    queryKey: ['youtubeTranscript', postId],
    queryFn: () => youtubePostsApi.getTranscript(postId),
    enabled: !!postId,
  });
}

export function useExtractYouTubeTranscript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId) => youtubePostsApi.extractTranscript(postId),
    onSuccess: (data, postId) => {
      queryClient.setQueryData(['youtubeTranscript', postId], data);
      queryClient.invalidateQueries({ queryKey: ['youtubePosts', 'list'] });
    },
  });
}
