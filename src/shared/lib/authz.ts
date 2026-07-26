import type {
  SessionUser,
  UserRole,
} from "@/shared/types/account/session.types";

type PermissionType = string & { readonly __brand: "Permission" };

// Source of truth: BE PermissionCodes.cs + PermissionSeed.cs (40 system codes, đã verify GH-106).
// Code dạng "module.action" lowercase. KHÔNG thêm code không tồn tại trong seed BE.
export const P = {
  // user.*
  USER_VIEW: "user.view" as PermissionType,
  USER_CREATE: "user.create" as PermissionType,
  USER_UPDATE: "user.update" as PermissionType,
  USER_DELETE: "user.delete" as PermissionType,
  USER_CHANGE_STATUS: "user.change_status" as PermissionType,
  USER_UNLOCK: "user.unlock" as PermissionType,
  USER_ASSIGN_ROLE: "user.assign_role" as PermissionType,
  USER_FORCE_LOGOUT: "user.force_logout" as PermissionType,
  USER_INVITE: "user.invite" as PermissionType,

  // role.*
  ROLE_VIEW: "role.view" as PermissionType,
  ROLE_CREATE: "role.create" as PermissionType,
  ROLE_UPDATE: "role.update" as PermissionType,
  ROLE_DELETE: "role.delete" as PermissionType,
  ROLE_ASSIGN_PERMISSION: "role.assign_permission" as PermissionType,

  // battery.*
  BATTERY_VIEW: "battery.view" as PermissionType,
  BATTERY_CREATE: "battery.create" as PermissionType,
  BATTERY_UPDATE: "battery.update" as PermissionType,
  BATTERY_DELETE: "battery.delete" as PermissionType,
  BATTERY_ASSIGN: "battery.assign" as PermissionType,
  BATTERY_CONFIGURE: "battery.configure" as PermissionType,

  // ticket.*
  TICKET_VIEW: "ticket.view" as PermissionType,
  TICKET_VIEW_ALL: "ticket.view_all" as PermissionType,
  TICKET_CREATE: "ticket.create" as PermissionType,
  TICKET_ASSIGN: "ticket.assign" as PermissionType,
  TICKET_RESOLVE: "ticket.resolve" as PermissionType,
  TICKET_CLOSE: "ticket.close" as PermissionType,
  TICKET_ESCALATE: "ticket.escalate" as PermissionType,

  // notification.*
  NOTIFICATION_VIEW: "notification.view" as PermissionType,
  NOTIFICATION_SEND: "notification.send" as PermissionType,
  NOTIFICATION_MANAGE_TEMPLATE:
    "notification.manage_template" as PermissionType,

  // knowledge_base.*
  KNOWLEDGE_BASE_VIEW: "knowledge_base.view" as PermissionType,
  KNOWLEDGE_BASE_CREATE: "knowledge_base.create" as PermissionType,
  KNOWLEDGE_BASE_UPDATE: "knowledge_base.update" as PermissionType,
  KNOWLEDGE_BASE_DELETE: "knowledge_base.delete" as PermissionType,
  KNOWLEDGE_BASE_PUBLISH: "knowledge_base.publish" as PermissionType,

  // reports.*
  REPORTS_VIEW: "reports.view" as PermissionType,
  REPORTS_EXPORT: "reports.export" as PermissionType,

  // audit.*
  AUDIT_VIEW: "audit.view" as PermissionType,

  // ticket.saga.* (Sprint 5B #241)
  TICKET_SAGA_VIEW: "ticket.saga.view" as PermissionType,
  TICKET_SAGA_REPROCESS: "ticket.saga.reprocess" as PermissionType,

  // chat.* (#CHAT-16)
  CHAT_CREATE_INTERNAL: "chat.create.internal" as PermissionType,
  CHAT_EDIT_ANY: "chat.edit.any" as PermissionType,
  CHAT_DELETE_ANY: "chat.delete.any" as PermissionType,
  CHAT_VIEW_INTERNAL: "chat.view.internal" as PermissionType,
} as const;

export const checkPermission = (
  user: SessionUser | null | undefined,
  permission: PermissionType,
): boolean => user?.permissions.includes(permission) ?? false;

export const checkRole = (
  user: SessionUser | null | undefined,
  ...roles: UserRole[]
): boolean => !!user && roles.includes(user.role);
