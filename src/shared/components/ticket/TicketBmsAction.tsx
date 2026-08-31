import { useState } from "react";
import { Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BmsSwitchControlCard from "@/shared/components/battery/BmsSwitchControlCard";
import SiteBmsSwitchDialog from "@/shared/components/battery/SiteBmsSwitchDialog";
import { useSiteSwitchableAssets } from "@/shared/hooks/battery/useSiteSwitchableAssets";
import { useIncidentDetail } from "@/shared/hooks/alerts/useEnvironmentalIncidents";
import { getTicketSubject } from "@/shared/lib/ticketSubject";
import { isOpenTicket } from "@/shared/utils/ticket.utils";
import type { TicketDTO } from "@/shared/types/ticket/ticket.types";

/**
 * The BMS control as a ticket header action, for the two shapes a ticket comes in.
 *
 *   battery ticket — cut charge/discharge on the battery the ticket is about. A ticket may name
 *   several, so more than one collapses into a menu; the switches are per battery either way.
 *
 *   site ticket    — the fault is environmental (smoke, gas, flooding), so the response is to
 *   de-energise the whole site. The site id comes from the incident record, which is why this
 *   fetches the incident rather than reading it off the ticket.
 *
 * Header placement is the point: cutting power is the first move on a thermal or overcharge
 * ticket, and it should not require leaving the ticket for the battery or site screen. The
 * confirmation, the ACK wait and the per-battery reporting all live in the two dialogs below —
 * this component only decides which one the ticket needs.
 *
 * Renders nothing when the ticket is about neither (kind "unknown"): there is nothing to switch.
 *
 * Nor on a finished ticket. Completed/Closed/ClosedRejected mean the work is done and signed
 * off, so the responder has no standing mandate to cut power from here — the same terminal set
 * that locks the chat thread. Switching a battery after close belongs on the battery or site
 * screen, where the action stands on its own rather than borrowing a settled ticket's context.
 */
export default function TicketBmsAction({ ticket }: { ticket: TicketDTO }) {
  const subject = getTicketSubject(ticket);
  const isSite = subject.kind === "site";
  const active = isOpenTicket(ticket);

  // Both hooks run unconditionally — `enabled` keeps the one this ticket doesn't need idle.
  const { data: incident } = useIncidentDetail(
    isSite ? subject.incidentId : "",
  );
  const [siteBmsOpen, setSiteBmsOpen] = useState(false);
  const { data: siteAssets, isLoading: loadingSiteAssets } =
    useSiteSwitchableAssets(incident?.siteId ?? "", siteBmsOpen);

  const [menuAssetId, setMenuAssetId] = useState<string | null>(null);

  if (!active) return null;

  if (isSite) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSiteBmsOpen(true)}
          // The site is only known once the incident record lands.
          disabled={!incident?.siteId}
        >
          <Power className="size-3.5 text-destructive" />
          BMS
        </Button>
        <SiteBmsSwitchDialog
          assets={siteAssets?.assets ?? []}
          truncated={siteAssets?.truncated}
          isLoading={loadingSiteAssets}
          open={siteBmsOpen}
          onOpenChange={setSiteBmsOpen}
        />
      </>
    );
  }

  const ids = subject.kind === "battery" ? subject.batteryAssetIds : [];
  if (ids.length === 0) return null;

  // One battery: the control renders its own trigger, no menu in between.
  if (ids.length === 1) return <BmsSwitchControlCard assetId={ids[0]} />;

  // Several: pick the battery first, then drive the dialog from here — passing `open` is what
  // suppresses the control's own trigger, since the menu item is already the affordance.
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" />}
          aria-label="BMS Control"
        >
          <Power className="size-3.5 text-amber-700 dark:text-amber-400" />
          BMS
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {ids.map((id, index) => (
            <DropdownMenuItem key={id} onClick={() => setMenuAssetId(id)}>
              Battery {index + 1}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {menuAssetId && (
        <BmsSwitchControlCard
          assetId={menuAssetId}
          open
          onOpenChange={(open) => !open && setMenuAssetId(null)}
        />
      )}
    </>
  );
}
