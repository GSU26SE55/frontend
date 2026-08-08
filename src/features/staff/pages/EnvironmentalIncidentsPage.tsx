import EnvironmentalIncidentsView from "@/shared/components/environmental/EnvironmentalIncidentsView";
import { useSiteList } from "@/features/staff/hooks/site/useSites";

export default function EnvironmentalIncidentsPage() {
  // Site list so Staff can choose a SiteId when reporting manually. Requires the BE
  // to open GET /api/sites for the Staff role — if not deployed yet, the query fails
  // → sites is undefined → the report button auto-hides.
  const { data } = useSiteList({ pageSize: 100 });
  return (
    <EnvironmentalIncidentsView
      subtitle="Staff · Environmental incidents"
      sites={data?.items}
    />
  );
}
