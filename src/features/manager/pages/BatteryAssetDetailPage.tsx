import { useParams } from "react-router-dom";
import BatteryRealtimeDetail from "@/shared/components/battery/BatteryRealtimeDetail";

// Manager — chi tiết battery real-time (read-only). Không CRUD/topology (chỉ Admin).
export default function BatteryAssetDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  return <BatteryRealtimeDetail assetId={id} />;
}
