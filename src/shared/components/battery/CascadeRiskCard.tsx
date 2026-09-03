import type { ReactNode } from "react";
import type { ElectricalTopologyName } from "@/shared/types/battery/cascade.types";

interface CascadeRiskCardProps {
  assetId: string;
  // Admin injects SetTopologyDialog + the button that opens it here. Manager/Staff have
  // no permission → don't pass it → the "Set topology" button doesn't show. BE blocks POST /topology for non-admins.
  topologyAction?: (ctx: {
    currentTopology?: ElectricalTopologyName;
    isLoading: boolean;
  }) => ReactNode;
}

// Cascade risk UI hidden on FE — component intentionally renders nothing.
export default function CascadeRiskCard(props: CascadeRiskCardProps) {
  void props;
  return null;
}
