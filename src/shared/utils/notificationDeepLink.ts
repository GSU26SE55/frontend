import { UserRole } from "@/shared/types/account/session.types";
import { NotificationTypeEnum } from "@/shared/enums/notification/notification.enum";
import type { NotificationDto } from "@/shared/types/notification/notification.types";

const ROLE_PREFIX: Record<UserRole, string> = {
  [UserRole.ADMIN]: "admin",
  [UserRole.MANAGER]: "manager",
  [UserRole.STAFF]: "staff",
  [UserRole.CUSTOMER]: "customer",
};

// `entityType` is a free-form string each BE consumer writes itself, not an enum — we have
// seen "Ticket", "ticket" and even "TicketId" depending on the place. Matching is
// case-insensitive so one consumer's odd casing does not break the deep link.
type EntityRoute = {
  // Path relative to the role prefix. `null` = that role has no matching page ⇒ no link is
  // generated (opening it in the inbox beats bouncing the user to /unauthorized).
  path: (id: string) => string;
  roles: UserRole[];
};

const ENTITY_ROUTES: Record<string, EntityRoute> = {
  ticket: {
    path: (id) => `tickets/${id}`,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
  },
  blogpost: {
    path: (id) => `blog/${id}`,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
  },
  blog: {
    path: (id) => `blog/${id}`,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
  },
  batteryasset: {
    path: (id) => `battery-assets/${id}`,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
  },
  battery: {
    path: (id) => `battery-assets/${id}`,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
  },
  site: {
    // Staff has no site page — leave the role out instead of pointing at a route that
    // does not exist.
    path: (id) => `sites/${id}`,
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  environmentalincident: {
    // Không có route `environmental-incidents/:id` — trang là một danh sách, chi tiết mở bằng
    // dialog. Deep link vì thế trỏ vào danh sách kèm ?incident=<id> và view tự mở dialog đó.
    // Staff không có trang này.
    path: (id) => `environmental-incidents?incident=${id}`,
    roles: [UserRole.ADMIN, UserRole.MANAGER],
  },
  iotdevice: {
    // Only Admin has /admin/iot-devices/:id.
    path: (id) => `iot-devices/${id}`,
    roles: [UserRole.ADMIN],
  },
  knowledgearticle: {
    path: (id) => `kb/${id}`,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
  },
};

/**
 * Returns the path to a notification's source content, or `null` when this entity type has
 * no detail page for the current role (system notifications, aggregated alerts, …).
 * `null` does not mean clicking does nothing — the caller opens it in the inbox instead.
 */
export function notificationDeepLink(
  n: Pick<NotificationDto, "entityType" | "entityId" | "type">,
  role?: UserRole,
): string | null {
  if (!n.entityType || !n.entityId || !role) return null;

  const entityType = n.entityType.trim().toLowerCase();

  // A freshly created ticket has no assignee yet — Manager works it from the Queue, not
  // from the plain ticket list, so the deep link must land on the queue's own detail route
  // (tickets/queue/:id) for "Back" to return to the Queue instead of the full ticket list.
  if (
    entityType === "ticket" &&
    role === UserRole.MANAGER &&
    n.type === NotificationTypeEnum.TicketCreated
  ) {
    return `/${ROLE_PREFIX[role]}/tickets/queue/${n.entityId}`;
  }

  const route = ENTITY_ROUTES[entityType];
  if (!route || !route.roles.includes(role)) return null;

  return `/${ROLE_PREFIX[role]}/${route.path(n.entityId)}`;
}
