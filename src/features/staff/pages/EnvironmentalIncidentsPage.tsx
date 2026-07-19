import EnvironmentalIncidentsView from "@/shared/components/environmental/EnvironmentalIncidentsView";
import { useSiteList } from "@/features/staff/hooks/site/useSites";

export default function EnvironmentalIncidentsPage() {
  // Site list để Staff chọn SiteId khi report thủ công. Cần BE mở GET /api/sites
  // cho role Staff — chưa deploy thì query lỗi → sites undefined → nút report tự ẩn.
  const { data } = useSiteList({ pageSize: 100 });
  return (
    <EnvironmentalIncidentsView
      subtitle="Staff · Sự cố môi trường"
      sites={data?.items}
    />
  );
}
