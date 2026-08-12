import { AlertTriangleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompareRow } from "@/shared/utils/ticket/compareRows";

interface Props {
  rows: CompareRow[];
}

export default function CompareFieldTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => {
            // Only highlight red when the field is critical AND actually differs.
            const critical = r.isCritical && r.isDiff;
            return (
              <tr
                key={r.label}
                className={cn(
                  "border-b last:border-0",
                  critical && "bg-destructive/5",
                  !critical && r.isDiff && "bg-amber-50 dark:bg-amber-950/20",
                )}
              >
                <th className="w-40 px-3 py-2 text-left align-top font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {r.label}
                    {critical && (
                      <AlertTriangleIcon className="size-3.5 text-destructive" />
                    )}
                  </span>
                </th>
                <td className="px-3 py-2 align-top wrap-break-word">
                  {r.source}
                </td>
                <td
                  className={cn(
                    "px-3 py-2 align-top wrap-break-word",
                    r.isDiff && "font-medium",
                  )}
                >
                  {r.target}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
