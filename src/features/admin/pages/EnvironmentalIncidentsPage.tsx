import EnvironmentalIncidentsView from "@/shared/components/environmental/EnvironmentalIncidentsView";
import { useSiteList } from "@/features/admin/hooks/site/useSites";

export default function EnvironmentalIncidentsPage() {
  const { data } = useSiteList({ pageSize: 100 });
  return (
    <EnvironmentalIncidentsView
      subtitle="Admin · Sự cố môi trường"
      sites={data?.items}
    />
  );
}
