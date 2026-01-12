import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { leadsApi, translationApi } from '../api';
import { queryKeys } from '../api/queryKeys';

function buildLeadParams(filters) {
  const params = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.category) params.category = filters.category;
  if (filters?.tag) params.tag = filters.tag;
  if (filters?.feed_id) params.feed_id = filters.feed_id;
  if (filters?.sort) params.sort = filters.sort;
  if (filters?.limit != null && filters.limit !== '') params.limit = filters.limit;
  if (filters?.offset != null && filters.offset !== '') params.offset = filters.offset;
  return params;
}

export function useLeadsList(filters) {
  return useQuery({
    queryKey: queryKeys.leadsList(filters),
    queryFn: () => leadsApi.getAll(buildLeadParams(filters)),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => leadsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['leads', 'list'] });
      const previous = queryClient.getQueriesData({ queryKey: ['leads', 'list'] });

      queryClient.setQueriesData({ queryKey: ['leads', 'list'] }, (old) =>
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
      queryClient.invalidateQueries({ queryKey: ['leads', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useTranslateLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filters) => translationApi.translateLeads(filters || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', 'list'] });
    },
  });
}

export function useDetectLeadLanguages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (force = false) => translationApi.detectMissingLanguages(force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', 'list'] });
    },
  });
}
