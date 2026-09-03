import { useNavigate } from "react-router-dom";
import { ExternalLink, Inbox } from "lucide-react";
import { formatDateTime } from "@/shared/utils/datetime";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { isUnreadStatus } from "@/shared/enums/notification/notification.enum";
import { notificationDeepLink } from "@/shared/utils/notificationDeepLink";
import {
  notificationTypeLabel,
  notificationChannelLabel,
  notificationStatusLabel,
} from "@/shared/constants/notificationLabels";
import { useMarkNotificationOpened } from "@/shared/hooks/notifications/useNotifications";
import { useNotificationEntityName } from "@/shared/hooks/notifications/useNotificationEntityName";
import type { NotificationDto } from "@/shared/types/notification/notification.types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5 text-xs">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1 min-w-0 text-foreground">{value}</span>
    </div>
  );
}

export default function NotificationDetailPane({
  notification,
  isLoading,
}: {
  notification?: NotificationDto;
  isLoading: boolean;
}) {
  const navigate = useNavigate();
  const { user } = useSessionStore();
  const markOpened = useMarkNotificationOpened();
  const entityName = useNotificationEntityName(
    notification?.entityType,
    notification?.entityId,
  );

  if (isLoading) {
    return (
      <div
        role="status"
        className="h-full flex items-center justify-center text-xs text-muted-foreground"
      >
        Loading…
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Inbox size={28} strokeWidth={1.5} />
        <p className="text-xs">Select a notification to view details</p>
      </div>
    );
  }

  const n = notification;
  const deepLink = notificationDeepLink(n, user?.role);
  // Display-only enhancement: entityId is a known, exact substring, so once its human-readable
  // name resolves, swap it into the body — old records seeded before the BE fix that composes
  // the body still had the raw GUID baked in (see BatteryAlertEscalationRequestedConsumer.cs history).
  const displayBody =
    entityName && n.entityId
      ? n.body.split(n.entityId).join(entityName)
      : n.body;

  // Clicking "Open content" is the real Opened event (user actively views the original
  // content). Just viewing it in the pane already gets marked Read by the parent page —
  // keep the BE's boundary between /read and /opened so the open-rate isn't inflated.
  const handleOpen = () => {
    if (!deepLink) return;
    if (isUnreadStatus(n.status)) markOpened.mutate(n.id);
    navigate(deepLink);
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-gutter-stable">
      {/* The open-content button sits in the header, aligned right of the title — the pane's
          main action shouldn't be buried in the body, requiring a scroll to find on long bodies. */}
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-1.5 py-0.5 rounded text-3xs font-medium bg-muted text-muted-foreground">
              {notificationTypeLabel(n.type)}
            </span>
            {isUnreadStatus(n.status) && (
              <span className="px-1.5 py-0.5 rounded text-3xs font-medium bg-primary text-primary-foreground">
                Unread
              </span>
            )}
          </div>
          <h2 className="text-sm font-semibold text-foreground">{n.title}</h2>
          <p className="text-2xs text-muted-foreground mt-0.5">
            {formatDateTime(n.createdAt)}
          </p>
        </div>

        {deepLink && (
          // Use the primary token instead of var(--p1): --p1 is the Critical-level red of the
          // alert system, so using it here would make a normal navigation button look dangerous.
          <button
            onClick={handleOpen}
            disabled={markOpened.isPending}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <ExternalLink size={13} />
            Open content
          </button>
        )}
      </div>

      <div className="px-5 py-4">
        <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
          {displayBody}
        </p>
      </div>

      <div className="px-5 py-3 border-t border-border">
        <h3 className="text-2xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          Info
        </h3>
        <Row label="Channel" value={notificationChannelLabel(n.channel)} />
        <Row label="Status" value={notificationStatusLabel(n.status)} />
        {n.sentAt && <Row label="Sent at" value={formatDateTime(n.sentAt)} />}
        {n.readAt && <Row label="Read at" value={formatDateTime(n.readAt)} />}
        {/* Only shown once the entity name resolves — a raw GUID (entityType has no
            resolver yet, or the fetch is still loading) isn't useful to the reader;
            the title/body/"Open content" link already cover getting to the right place. */}
        {n.entityType && entityName && (
          <Row
            label="Entity"
            value={<span className="break-all">{entityName}</span>}
          />
        )}
      </div>
    </div>
  );
}
