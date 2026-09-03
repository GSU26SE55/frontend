import type { SiteCascadeRiskSummaryDto } from "@/shared/types/battery/cascade.types";

interface CascadeRiskSummaryProps {
  summary: SiteCascadeRiskSummaryDto | undefined;
  isLoading?: boolean;
}

// Cascade risk UI hidden on FE — component intentionally renders nothing.
export default function CascadeRiskSummary(props: CascadeRiskSummaryProps) {
  void props;
  return null;
}
