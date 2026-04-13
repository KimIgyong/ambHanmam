import { useQuery } from '@tanstack/react-query';
import { pricingApi, type FullPricingData } from '@/lib/pricing-api';

export function usePricingData() {
  return useQuery<FullPricingData>({
    queryKey: ['pricing', 'full'],
    queryFn: () => pricingApi.getFullPricingData(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
