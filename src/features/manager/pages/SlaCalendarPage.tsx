import SlaCalendarView from "@/shared/components/sla/SlaCalendarView";

// See the note in the Admin page — one shared view, one route per portal.
export default function SlaCalendarPage() {
  return <SlaCalendarView roleLabel="Manager" />;
}
