import { useParams } from "react-router-dom";
import BatteryRealtimeDetail from "@/shared/components/battery/BatteryRealtimeDetail";
import BmsSwitchControlCard from "@/shared/components/battery/BmsSwitchControlCard";

// Manager — real-time battery detail. No CRUD/topology (Admin only), but the BMS control
// is available: the API authorizes Manager on both bms-switch endpoints.
export default function BatteryAssetDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  return (
    <BatteryRealtimeDetail
      assetId={id}
      headerActions={<BmsSwitchControlCard assetId={id} />}
    />
  );
}
