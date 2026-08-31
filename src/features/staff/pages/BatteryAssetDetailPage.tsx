import { useParams } from "react-router-dom";
import BatteryRealtimeDetail from "@/shared/components/battery/BatteryRealtimeDetail";
import BmsSwitchControlCard from "@/shared/components/battery/BmsSwitchControlCard";

// Staff — real-time battery detail (read-only) for the battery linked to the ticket being handled.
export default function BatteryAssetDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  return (
    <BatteryRealtimeDetail
      assetId={id}
      headerActions={<BmsSwitchControlCard assetId={id} />}
    />
  );
}
