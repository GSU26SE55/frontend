import AmbientConfigView from "@/shared/components/ambient/AmbientConfigView";
import { useSiteList } from "@/features/manager/hooks/useSites";

export default function AmbientConfigPage() {
  const { data } = useSiteList({ pageSize: 100 });
  return (
    <AmbientConfigView
      subtitle="Manager · Môi trường site"
      sites={data?.items ?? []}
    />
  );
}
