import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceCatalogApiService } from '../service/service-catalog.service';

const serviceKeys = {
  all: ['svc-services'] as const,
  list: (params?: { status?: string; category?: string }) => [...serviceKeys.all, 'list', params] as const,
  detail: (id: string) => [...serviceKeys.all, 'detail', id] as const,
  plans: (serviceId: string) => [...serviceKeys.all, 'plans', serviceId] as const,
};

export const useServiceList = (params?: { status?: string; category?: string }) => {
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => serviceCatalogApiService.getServices(params),
  });
};

export const useServiceDetail = (id: string) => {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => serviceCatalogApiService.getServiceById(id),
    enabled: !!id,
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => serviceCatalogApiService.createService(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: serviceKeys.all }); },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      serviceCatalogApiService.updateService(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: serviceKeys.all }); },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceCatalogApiService.deleteService(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: serviceKeys.all }); },
  });
};

export const useServicePlans = (serviceId: string) => {
  return useQuery({
    queryKey: serviceKeys.plans(serviceId),
    queryFn: () => serviceCatalogApiService.getPlans(serviceId),
    enabled: !!serviceId,
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: Record<string, unknown> }) =>
      serviceCatalogApiService.createPlan(serviceId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: serviceKeys.all }); },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, planId, data }: { serviceId: string; planId: string; data: Record<string, unknown> }) =>
      serviceCatalogApiService.updatePlan(serviceId, planId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: serviceKeys.all }); },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, planId }: { serviceId: string; planId: string }) =>
      serviceCatalogApiService.deletePlan(serviceId, planId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: serviceKeys.all }); },
  });
};
