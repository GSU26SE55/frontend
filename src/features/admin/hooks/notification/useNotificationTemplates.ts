import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationTemplateService } from "@/features/admin/services/notification/notification-template.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  NotificationTemplateListParams,
  CreateNotificationTemplatePayload,
  ReviseNotificationTemplatePayload,
  TemplateSampleDataPayload,
} from "@/features/admin/types/notification/notification-template.types";

// Templates are nearly static (only change on reseed or when an admin edits) → cache for 5 minutes.
// Returns BE's full pagination block (items + totalItems + totalPages + hasNext/Prev) — the page
// needs all these fields for DataPagination, they can't be inferred from array length alone.
export const useNotificationTemplates = (
  params?: NotificationTemplateListParams,
) =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationTemplates.list(params),
    queryFn: () =>
      notificationTemplateService.getList(params).then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

// The variable-name contract is STATIC data derived from backend code — it doesn't change within
// a session, so cache it as `Infinity` instead of picking an arbitrary minute count. Only a deploy can change it.
export const useTemplateVariables = () =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationTemplates.variables(),
    queryFn: () =>
      notificationTemplateService.getVariables().then((r) => r.data.data),
    staleTime: Infinity,
    gcTime: Infinity,
  });

// Coverage, by contrast, reads from live data (notifications generated + active templates), so it
// must expire quickly and be invalidated after every template edit.
export const useTemplateCoverage = () =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationTemplates.coverage(),
    queryFn: () =>
      notificationTemplateService.getCoverage().then((r) => r.data.data),
    staleTime: 60_000,
  });

// Preview doesn't change server state → mutation (no cache); a Handlebars syntax
// error returns 400 and is shown right in the dialog instead of drifting away as a toast.
export const usePreviewTemplate = () =>
  useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: TemplateSampleDataPayload;
    }) => notificationTemplateService.preview(id, payload).then((r) => r.data),
  });

export const useTestSendTemplate = () =>
  useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: TemplateSampleDataPayload;
    }) => notificationTemplateService.testSend(id, payload).then((r) => r.data),
    onSuccess: (res) => {
      // BE message: "Test sent to {email}." — show it verbatim so the admin knows the recipient address.
      const remaining = res.data?.remainingThisHour;
      toast.success(
        res.message ?? "Test sent",
        remaining !== undefined
          ? { description: `${remaining} left this hour` }
          : undefined,
      );
    },
    onError: (error) => handleErrorApi({ error }),
  });

export const useActivateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      notificationTemplateService.activate(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationTemplates });
      toast.success(res.message ?? "Version activated");
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

// Create/edit are used in a form ⇒ do NOT set onError here: the component calls mutateAsync in try-catch, then
// handleErrorApi({ error, setError }) so each field's error shows under the right input. Setting onError on the hook
// would swallow the error into a toast and the input would never turn red.
export const useCreateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNotificationTemplatePayload) =>
      notificationTemplateService.create(payload).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationTemplates });
      toast.success(res.message ?? "Notification template created");
    },
  });
};

export const useReviseTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ReviseNotificationTemplatePayload;
    }) => notificationTemplateService.revise(id, payload).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationTemplates });
      toast.success(res.message ?? "New version created");
    },
  });
};

// Delete has no form ⇒ use onError to fire the toast directly (BE returns 409 when deleting a version still in use).
export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      notificationTemplateService.remove(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationTemplates });
      toast.success(res.message ?? "Version deleted");
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
