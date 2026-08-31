import SlaCalendarView from "@/shared/components/sla/SlaCalendarView";

// Admin and Manager get the identical screen — the BE authorises both roles the same way,
// so the whole view lives in shared/ and each portal only owns its route and breadcrumb.
export default function SlaCalendarPage() {
  return <SlaCalendarView roleLabel="Admin" />;
}
