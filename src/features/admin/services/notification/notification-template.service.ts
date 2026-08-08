import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  NotificationTemplateDto,
  NotificationTemplateListParams,
  CreateNotificationTemplatePayload,
  ReviseNotificationTemplatePayload,
  TemplateSampleDataPayload,
  TemplatePreviewDto,
  TemplateTestSendDto,
  TemplateVariableGroupDto,
  TemplateCoverageDto,
} from "@/features/admin/types/notification/notification-template.types";

export const notificationTemplateService = {
  // Includes versions with isActive = false as well, to show version history.
  // BE sort: type → channel → version descending → id (tiebreaker for total ordering).
  getList: (params?: NotificationTemplateListParams) =>
    axiosInstance.get<
      CommonResponse<PaginationResponse<NotificationTemplateDto>>
    >(ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.LIST, { params }),

  getById: (id: string) =>
    axiosInstance.get<CommonResponse<NotificationTemplateDto>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.DETAIL(id),
    ),

  // Creates the first template for a pair that doesn't exist yet. Existing pair ⇒ 409, broken Handlebars syntax ⇒ 400.
  create: (payload: CreateNotificationTemplatePayload) =>
    axiosInstance.post<CommonResponse<string>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.CREATE,
      payload,
    ),

  // Editing = generates a new version then activates it. The old version is KEPT for rollback.
  revise: (id: string, payload: ReviseNotificationTemplatePayload) =>
    axiosInstance.put<CommonResponse<string>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.REVISE(id),
      payload,
    ),

  // Soft-deletes one version. BE blocks deleting the active version (409).
  remove: (id: string) =>
    axiosInstance.delete<CommonResponse<string>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.DELETE(id),
    ),

  // Renders a trial with sample data — does NOT send anywhere.
  preview: (id: string, payload: TemplateSampleDataPayload) =>
    axiosInstance.post<CommonResponse<TemplatePreviewDto>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.PREVIEW(id),
      payload,
    ),

  // Sends to the currently logged-in admin (address taken from JWT, NOT accepted from the body).
  // Email channel templates only; exceeding 5 requests/hour → 429.
  testSend: (id: string, payload: TemplateSampleDataPayload) =>
    axiosInstance.post<CommonResponse<TemplateTestSendDto>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.TEST_SEND(id),
      payload,
    ),

  // Rollback: deactivates the active version + activates the selected version in a single save.
  activate: (id: string) =>
    axiosInstance.post<CommonResponse<null>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.ACTIVATE(id),
    ),

  // Valid variables per type — static data, BE doesn't touch the DB.
  getVariables: () =>
    axiosInstance.get<CommonResponse<TemplateVariableGroupDto[]>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.VARIABLES,
    ),

  // Coverage is calculated from ACTUAL generated notifications (not the config matrix — the two used to diverge).
  getCoverage: () =>
    axiosInstance.get<CommonResponse<TemplateCoverageDto[]>>(
      ENDPOINTS.ADMIN.NOTIFICATION_TEMPLATES.COVERAGE,
    ),
};
