import { useParams } from "react-router-dom";
import BatteryRealtimeDetail from "@/shared/components/battery/BatteryRealtimeDetail";

// Manager — real-time battery detail (read-only). No CRUD/topology (Admin only).
export default function BatteryAssetDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  return <BatteryRealtimeDetail assetId={id} />;
}
