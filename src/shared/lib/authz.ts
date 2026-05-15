import type { SessionUser, UserRole } from '@/shared/types/session.types';

type PermissionType = string & { readonly __brand: 'Permission' };

export const P = {
  TICKET_VIEW: 'ticket.view' as PermissionType,
  TICKET_CREATE: 'ticket.create' as PermissionType,
  TICKET_TRIAGE: 'ticket.triage' as PermissionType,
  TICKET_ASSIGN: 'ticket.assign' as PermissionType,
  TICKET_ESCALATE: 'ticket.escalate' as PermissionType,
  TICKET_CLOSE: 'ticket.close' as PermissionType,
  TICKET_CLOSE_REJECT: 'ticket.close_reject' as PermissionType,

  BATTERY_VIEW: 'battery.view' as PermissionType,
  BATTERY_CREATE: 'battery.create' as PermissionType,
  BATTERY_UPDATE: 'battery.update' as PermissionType,
  BATTERY_DELETE: 'battery.delete' as PermissionType,
  BATTERY_ASSIGN: 'battery.assign' as PermissionType,
  BATTERY_CONFIG_VIEW: 'battery.config.view' as PermissionType,
  BATTERY_CONFIG_UPDATE: 'battery.config.update' as PermissionType,

  USER_VIEW: 'user.view' as PermissionType,
  USER_CREATE: 'user.create' as PermissionType,
  USER_UPDATE: 'user.update' as PermissionType,
  USER_INVITE: 'user.invite' as PermissionType,
  USER_DEACTIVATE: 'user.deactivate' as PermissionType,

  SLA_VIEW: 'sla.view' as PermissionType,
  SLA_CONFIGURE: 'sla.configure' as PermissionType,

  AUDIT_LOG_VIEW: 'audit_log.view' as PermissionType,
  REPORT_VIEW: 'report.view' as PermissionType,

  NOTIFICATION_VIEW: 'notification.view' as PermissionType,

  MAINTENANCE_LOG_VIEW: 'maintenance_log.view' as PermissionType,
  MAINTENANCE_LOG_CREATE: 'maintenance_log.create' as PermissionType,
} as const;

export const checkPermission = (
  user: SessionUser | null | undefined,
  permission: PermissionType
): boolean => user?.permissions.includes(permission) ?? false;

export const checkRole = (
  user: SessionUser | null | undefined,
  ...roles: UserRole[]
): boolean => !!user && roles.includes(user.role);
