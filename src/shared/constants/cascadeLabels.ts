// Cascade risk / electrical topology display labels — shared by CascadeRiskCard, SiteAssetsTable
// and CascadeRiskSummary so the wiring name reads identically everywhere it shows up. Kept in its
// own file (not inside CascadeRiskCard.tsx) because a component file may only export components
// (react-refresh/only-export-components).
import type { ElectricalTopologyName } from "@/shared/types/battery/cascade.types";

export const TOPOLOGY_LABEL: Record<ElectricalTopologyName, string> = {
  Independent: "Independent",
  SeriesString: "Series",
  ParallelBank: "Parallel",
  SeriesParallel: "Series-Parallel",
};
