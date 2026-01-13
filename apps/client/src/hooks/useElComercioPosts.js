import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { elComercioPostsApi } from '../api';
import { queryKeys } from '../api/queryKeys';

function buildElComercioParams(filters) {
  const params = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.el_comercio_feed_id) params.el_comercio_feed_id = filters.el_comercio_feed_id;
  if (filters?.approval_status) params.approval_status = filters.approval_status;
  if (filters?.limit != null && filters.limit !== '') params.limit = filters.limit;
  if (filters?.offset != null && filters.offset !== '') params.offset = filters.offset;
  return params;
}

export function useElComercioPostsList(filters) {
  return useQuery({
    queryKey: queryKeys.elComercioPostsList(filters),
    queryFn: () => elComercioPostsApi.getAll(buildElComercioParams(filters)),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteElComercioPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => elComercioPostsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['elComercioPosts', 'list'] });
      const previous = queryClient.getQueriesData({ queryKey: ['elComercioPosts', 'list'] });

      queryClient.setQueriesData({ queryKey: ['elComercioPosts', 'list'] }, (old) =>
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
      queryClient.invalidateQueries({ queryKey: ['elComercioPosts', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}
