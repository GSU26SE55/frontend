import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTemplateCoverage } from "@/features/admin/hooks/notification/useNotificationTemplates";
import {
  notificationTypeLabel,
  notificationChannelLabel,
} from "@/shared/constants/notificationLabels";

/**
 * Reconciles the templates we have against the **notifications actually sent**.
 *
 * Why measure against real notifications instead of the config: the two have drifted apart before.
 * The battery consumer was also sending over SMS while the channel config table didn't declare SMS,
 * so 98 SMS messages went out with no template covering them — only real data exposes that gap.
 *
 * Two things this table answers:
 *  - Which pairs are sending with **hardcoded copy** (no template yet) ⇒ changing the wording needs a deploy.
 *  - Which templates reference **variables that don't exist** ⇒ those spots render empty when sent.
 */
export default function TemplateCoveragePanel() {
  const { data, isLoading } = useTemplateCoverage();
  const [expanded, setExpanded] = useState(false);

  const { thieuMau, mauHong, tong } = useMemo(() => {
    const rows = data ?? [];
    return {
      thieuMau: rows.filter((r) => !r.hasActiveTemplate),
      mauHong: rows.filter(
        (r) => r.hasActiveTemplate && r.unknownVariables.length > 0,
      ),
      tong: rows.length,
    };
  }, [data]);

  if (isLoading || !data) return null;

  const canhBao = thieuMau.length + mauHong.length;
  const dangChuY = [...thieuMau, ...mauHong];

  return (
    <Card className="rounded-xl px-4 py-3 gap-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {canhBao === 0 ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          )}
          <div>
            <p className="text-sm font-medium">
              {canhBao === 0
                ? `All ${tong} active pairs (type × channel) have a template`
                : `${canhBao}/${tong} active pairs need attention`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {canhBao === 0 ? (
                <>
                  Every notification being sent takes its content from a
                  template, and no template references a variable that doesn't
                  exist.
                </>
              ) : (
                <>
                  {thieuMau.length > 0 && (
                    <>
                      <b>{thieuMau.length}</b> pairs have no template — they use
                      hardcoded copy, so changing the wording needs a
                      redeploy.{" "}
                    </>
                  )}
                  {mauHong.length > 0 && (
                    <>
                      <b>{mauHong.length}</b> templates reference variables that
                      don't exist — those spots render empty when sent.
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        {dangChuY.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <ChevronUp className="size-3.5" /> Collapse
              </>
            ) : (
              <>
                <ChevronDown className="size-3.5" /> View details
              </>
            )}
          </Button>
        )}
      </div>

      {expanded && dangChuY.length > 0 && (
        <div className="mt-3 overflow-x-auto border-t border-border pt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-1.5 pr-3 font-medium">Notification type</th>
                <th className="pb-1.5 pr-3 font-medium">Channel</th>
                <th className="pb-1.5 pr-3 font-medium text-right">Sent</th>
                <th className="pb-1.5 font-medium">Issue</th>
              </tr>
            </thead>
            <tbody>
              {dangChuY.map((r) => (
                <tr
                  key={`${r.type}-${r.channel}`}
                  className="border-t border-border/60"
                >
                  <td className="py-1.5 pr-3">
                    {notificationTypeLabel(r.type)}
                  </td>
                  <td className="py-1.5 pr-3">
                    {notificationChannelLabel(r.channel)}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {r.notificationCount.toLocaleString("vi-VN")}
                  </td>
                  <td className="py-1.5">
                    {!r.hasActiveTemplate ? (
                      <Badge variant="outline" className="font-normal">
                        No template
                      </Badge>
                    ) : (
                      <span className="text-xs">
                        Unknown variables:{" "}
                        {r.unknownVariables.map((v, i) => (
                          <span key={v}>
                            {i > 0 && ", "}
                            <code className="font-mono text-destructive">{`{{${v}}}`}</code>
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
