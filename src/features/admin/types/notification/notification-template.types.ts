import type {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";

// Notification template admin (Sprint 6.3 NOTI3-12) — /api/admin/notification-templates.
//
// 02/08/2026 — two contract changes:
//  1. type/channel are now returned by BE as NUMBERS (previously English enum NAMES). FE maps them
//     to display labels via shared/constants/notificationLabels.ts.
//  2. `locale` removed entirely — Vietnamese-only system, the column has been dropped from the DB.

export interface NotificationTemplateDto {
  id: string;
  type: NotificationTypeEnum;
  channel: NotificationChannelEnum;
  version: number; // version number within the same pair (Type × Channel)
  isActive: boolean; // the version currently used by the dispatcher — each pair has exactly 1
  titleTemplate: string;
  bodyTemplate: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface NotificationTemplateListParams {
  // BE accepts both numeric and enum name; FE sends the number to match the type currently in use.
  type?: NotificationTypeEnum;
  channel?: NotificationChannelEnum;
  // true ⇒ only fetch the active version of each pair, hiding version history.
  activeOnly?: boolean;
  // BE pagination (PaginationRequest): pageNumber <= 0 → 1; pageSize outside 1..100 → 10 or 100.
  pageNumber?: number;
  pageSize?: number;
}

// Limits match the DB column (title_template 500, body_template 4000) and also match BE's
// ValidateAsync — so the error shows up right while typing instead of waiting for a 400 from the server.
export const TEMPLATE_TITLE_MAX = 500;
export const TEMPLATE_BODY_MAX = 4000;

// Creates the FIRST template for a (type × channel) pair that doesn't exist yet. Existing pair ⇒ BE returns 409.
export interface CreateNotificationTemplatePayload {
  type: NotificationTypeEnum;
  channel: NotificationChannelEnum;
  titleTemplate: string;
  bodyTemplate: string;
}

// Editing = generates a NEW VERSION then activates it, does not overwrite the old version.
// Intentionally has no type/channel: BE takes it from the original version so no one can change
// the pair and break the version chain.
export interface ReviseNotificationTemplatePayload {
  titleTemplate: string;
  bodyTemplate: string;
}

// preview + test-send share the same body. Not sending ⇒ renders with an empty model.
export interface TemplateSampleDataPayload {
  sampleData?: Record<string, unknown>;
}

export interface TemplatePreviewDto {
  type: NotificationTypeEnum;
  channel: NotificationChannelEnum;
  version: number;
  title: string; // already rendered
  body: string; // already rendered
}

// Recipient address is ALWAYS the currently logged-in admin (BE takes it from JWT) — FE does not send an email.
export interface TemplateTestSendDto {
  remainingThisHour: number; // max(0, 5 - used so far)
}

// ── 03/08/2026: variable naming contract ────────────────────────────────────────────────────────
//
// A template references a variable as `{{variableName}}`, and that name must match EXACTLY the key
// the consumer writes into the payload — not just a name that sounds reasonable. Handlebars renders
// an unknown variable as an empty string rather than raising an error, so a template with a wrong
// name still saves fine, still sends fine — only the recipient ends up reading a truncated sentence.
// This project's template set once ran for months with `{{ticketCode}}` while the consumer wrote the
// key `code`, and `{{serialNumber}}` while the consumer wrote `assetSerialNumber`.

export interface TemplateVariableGroupDto {
  type: NotificationTypeEnum;
  /** BE-side enum name — used for cross-referencing; the display label still comes from notificationLabels. */
  typeName: string;
  /** Six variables always present, the same across every type: Title, Body, EntityType, EntityId, UserId, CreatedAt. */
  builtin: string[];
  /** Keys specific to this type. **Empty** ⇒ the consumer writes no payload, only `builtin` is usable. */
  payload: string[];
}

export interface TemplateCoverageDto {
  type: NotificationTypeEnum;
  typeName: string;
  channel: NotificationChannelEnum;
  /** Number of notification rows generated for this pair — a measure of how much it matters. */
  notificationCount: number;
  /** `false` ⇒ every notification for this pair is currently using a hardcoded string in the consumer. */
  hasActiveTemplate: boolean;
  /** Template variables in use but absent from the data ⇒ renders empty. Empty is fine. */
  unknownVariables: string[];
}
