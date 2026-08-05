import { useQuery } from "@tanstack/react-query";
import { adminRolesService } from "@/features/admin/services/account/admin-roles.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

/**
 * Resolve roleId theo normalizedName ("CUSTOMER", "STAFF", "MANAGER", "ADMIN").
 *
 * BE seed system role bằng Guid.NewGuid() lúc runtime (migration
 * RemoveRoleHasDataSeed đã bỏ GUID hardcode) → roleId KHÁC NHAU giữa các môi
 * trường. Vì vậy FE không được hardcode role GUID, phải tra theo
 * normalizedName — field này ổn định.
 *
 * Cache lâu (staleTime 1h) vì system role gần như không đổi.
 */
export function useRoleId(normalizedName: string) {
  const params = { pageSize: 100 };

  return useQuery({
    queryKey: QUERY_KEY.admin.roles.list(params),
    queryFn: () => adminRolesService.getList(params).then((r) => r.data.data),
    staleTime: 60 * 60 * 1000,
    select: (data) =>
      data?.items.find(
        (role) =>
          role.normalizedName.toUpperCase() === normalizedName.toUpperCase(),
      )?.id,
  });
}
