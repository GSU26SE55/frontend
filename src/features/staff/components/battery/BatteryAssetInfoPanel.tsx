import { Link } from "react-router-dom";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { BatteryFull, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStaffBatteryAsset } from "@/features/staff/hooks/battery/useBatteryAsset";
import {
  BatteryStatusEnum,
  WarrantyStatusEnum,
} from "@/features/staff/types/battery/battery-asset.types";
import BatteryWarningEvidencePanel from "@/shared/components/battery/BatteryWarningEvidencePanel";
import CustomerHoverCard from "@/features/staff/components/account/CustomerHoverCard";

const STATUS_LABEL: Record<BatteryStatusEnum, string> = {
  [BatteryStatusEnum.Active]: "Active",
  [BatteryStatusEnum.Inactive]: "Inactive",
  [BatteryStatusEnum.Decommissioned]: "Decommissioned",
};

const WARRANTY_LABEL: Record<WarrantyStatusEnum, string> = {
  [WarrantyStatusEnum.ACTIVE]: "Under warranty",
  [WarrantyStatusEnum.EXPIRED]: "Warranty expired",
  [WarrantyStatusEnum.VOID]: "Void",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">
        {value ?? <span className="text-muted-foreground/50">—</span>}
      </span>
    </div>
  );
}

/** ±2' — mirrors useReadingEvidence / the ambient evidence window. */
const EVIDENCE_WINDOW_MS = 2 * 60 * 1_000;

interface Props {
  batteryAssetId?: string | null;
  /** Incident detection time (ticket.detectedAt) — used to show the warning evidence log. */
  detectedAt?: string | null;
}

export default function BatteryAssetInfoPanel({
  batteryAssetId,
  detectedAt,
}: Props) {
  const {
    data: asset,
    isLoading,
    isError,
  } = useStaffBatteryAsset(batteryAssetId);

  if (!batteryAssetId) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        This ticket isn't linked to any battery device.
      </p>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (isError || !asset) {
    return (
      <p className="text-sm text-destructive text-center py-6">
        Couldn't load battery device information.
      </p>
    );
  }

  // ±2' around detection — the same width as the evidence table below, and as the site-level
  // ambient panel, so "around detection" means one thing across the whole app.
  const detectedMs = detectedAt ? new Date(detectedAt).getTime() : NaN;
  const realtimeQuery = Number.isNaN(detectedMs)
    ? ""
    : `?${new URLSearchParams({
        tab: "history",
        from: new Date(detectedMs - EVIDENCE_WINDOW_MS).toISOString(),
        to: new Date(detectedMs + EVIDENCE_WINDOW_MS).toISOString(),
      }).toString()}`;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BatteryFull className="size-4 text-muted-foreground" />
        <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
          Battery device information
        </p>
        <Badge variant="outline" className="ml-auto text-2xs font-normal">
          {STATUS_LABEL[asset.status] ?? asset.status}
        </Badge>
      </div>

      {/* Open the real-time detail page for this battery. When the ticket carries a detection
          time, the link lands on Sensor history already filtered to the ±2' window around it —
          the same span as the evidence table above, so the two agree. */}
      <Link
        to={`/staff/battery-assets/${batteryAssetId}${realtimeQuery}`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-full mb-3",
        )}
      >
        <Activity className="size-3.5" />
        View real-time detail
      </Link>
      <div className="divide-y divide-border/50">
        <InfoRow label="Serial number" value={asset.serialNumber} />
        <InfoRow label="Battery type" value={asset.batteryTypeName} />
        <InfoRow label="Site" value={asset.siteName} />
        <InfoRow
          label="Customer"
          value={
            <CustomerHoverCard
              customerId={asset.customerId}
              customerName={asset.customerName}
            />
          }
        />
        <InfoRow
          label="Install date"
          value={format(new Date(asset.installDate), "dd/MM/yyyy", {
            locale: enUS,
          })}
        />
        <InfoRow
          label="Warranty"
          value={
            <>
              {WARRANTY_LABEL[asset.warrantyStatus] ?? asset.warrantyStatus}
              {asset.warrantyEndDate &&
                ` (until ${format(new Date(asset.warrantyEndDate), "dd/MM/yyyy")})`}
            </>
          }
        />
      </div>

      <div className="mt-5">
        <BatteryWarningEvidencePanel
          batteryAssetId={batteryAssetId}
          detectedAt={detectedAt}
          batteryTypeId={asset.batteryTypeId}
        />
      </div>
    </div>
  );
}
