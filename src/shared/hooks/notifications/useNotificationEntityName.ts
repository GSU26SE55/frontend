import { useAlertDetail } from "@/shared/hooks/alerts/useAlerts";
import { useBatteryAsset } from "@/shared/hooks/battery/useBatteryAsset";

// Resolves a notification's entityType/entityId into a human-readable name, so the
// detail pane can show "BAT-2026-004" instead of a raw GUID. entityType is free-form
// BE text (inconsistent casing observed) — same normalization as notificationDeepLink.ts.
//
// Only entity types with a hook already in shared/ are covered here (Alert, BatteryAsset) —
// IoT device/Ticket/Site detail hooks are still feature-scoped per role and would need
// promotion to shared/ before they could be added here without violating feature isolation.
export function useNotificationEntityName(
  entityType?: string | null,
  entityId?: string | null,
): string | null {
  const type = entityType?.trim().toLowerCase();
  const id = entityId ?? "";

  const alert = useAlertDetail(type === "alert" ? id : "");
  const battery = useBatteryAsset(
    type === "batteryasset" || type === "battery" ? id : null,
  );

  if (type === "alert") return alert.data?.batterySerialNumber ?? null;
  if (type === "batteryasset" || type === "battery")
    return battery.data?.serialNumber ?? null;
  return null;
}
