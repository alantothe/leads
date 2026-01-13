import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { elComercioFeedsApi } from '../api';
import { queryKeys } from '../api/queryKeys';

export function useElComercioFeeds() {
  return useQuery({
    queryKey: queryKeys.elComercioFeeds,
    queryFn: () => elComercioFeedsApi.getAll(),
  });
}

export function useCreateElComercioFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => elComercioFeedsApi.create(data),
    onSuccess: (created) => {
      queryClient.setQueryData(queryKeys.elComercioFeeds, (old) =>
        Array.isArray(old) ? [...old, created] : [created]
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elComercioFeeds });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useUpdateElComercioFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => elComercioFeedsApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.elComercioFeeds, (old) =>
        Array.isArray(old)
          ? old.map((item) => (item.id === updated.id ? updated : item))
          : old
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elComercioFeeds });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useDeleteElComercioFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => elComercioFeedsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.elComercioFeeds });
      const previous = queryClient.getQueryData(queryKeys.elComercioFeeds);

      queryClient.setQueryData(queryKeys.elComercioFeeds, (old) =>
        Array.isArray(old) ? old.filter((item) => item.id !== id) : old
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.elComercioFeeds, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elComercioFeeds });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useToggleElComercioFeedActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feed) => {
      if (feed.is_active === 1) {
        return elComercioFeedsApi.deactivate(feed.id);
      }
      return elComercioFeedsApi.activate(feed.id);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.elComercioFeeds, (old) =>
        Array.isArray(old)
          ? old.map((item) => (item.id === updated.id ? updated : item))
          : old
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elComercioFeeds });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useFetchElComercioFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedId) => elComercioFeedsApi.fetch(feedId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elComercioFeeds });
      queryClient.invalidateQueries({ queryKey: ['elComercioPosts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['approval'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useFetchAllElComercioFeeds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => elComercioFeedsApi.fetchAll(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elComercioFeeds });
      queryClient.invalidateQueries({ queryKey: ['elComercioPosts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['approval'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}
