import { useQuery } from '@tanstack/react-query';
import { KEY } from '@/shared/utils/queryKeys';
import { adminAccountService } from '@/features/admin/services/account.service';

export function useCustomers(params?: { pageNumber?: number; pageSize?: number; keyword?: string }) {
  return useQuery({
    queryKey: [KEY.admin.accounts, 'customers', params],
    queryFn: () => adminAccountService.getCustomers(params).then((r) => r.data.data),
  });
}
