import AmbientConfigView from "@/shared/components/ambient/AmbientConfigView";
import { useSiteList } from "@/features/admin/hooks/site/useSites";

export default function AmbientConfigPage() {
  const { data } = useSiteList({ pageSize: 100 });
  return (
    <AmbientConfigView
      subtitle="Admin · Site environment"
      sites={data?.items ?? []}
    />
  );
}
