import { useParams } from "react-router-dom";
import BatteryRealtimeDetail from "@/shared/components/battery/BatteryRealtimeDetail";

// Staff — chi tiết battery real-time (read-only) cho pin gắn ticket đang xử lý.
export default function BatteryAssetDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  return <BatteryRealtimeDetail assetId={id} />;
}
