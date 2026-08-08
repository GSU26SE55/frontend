import { useQuery } from "@tanstack/react-query";
import { adminRolesService } from "@/features/admin/services/account/admin-roles.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

/**
 * Resolve roleId by normalizedName ("CUSTOMER", "STAFF", "MANAGER", "ADMIN").
 *
 * BE seeds system roles with Guid.NewGuid() at runtime (the
 * RemoveRoleHasDataSeed migration removed the hardcoded GUID) → roleId
 * DIFFERS between environments. So FE must not hardcode a role GUID and
 * must look it up by normalizedName — this field is stable.
 *
 * Long cache (staleTime 1h) since system roles almost never change.
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
