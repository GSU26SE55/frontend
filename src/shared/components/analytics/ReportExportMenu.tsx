import { Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExportReport } from "@/shared/hooks/dashboard/useReports";
import { ReportFormat } from "@/shared/enums/dashboard/report.enum";

interface ReportExportMenuProps {
  endpoint: string;
  filename: string; // no file extension included
  params?: Record<string, unknown>;
  disabled?: boolean;
}

// Export button + dropdown to pick CSV/XLSX. The BE returns the file via ?format=, the hook downloads the blob.
export function ReportExportMenu({
  endpoint,
  filename,
  params,
  disabled,
}: ReportExportMenuProps) {
  const exportReport = useExportReport();

  const handleExport = (format: ReportFormat) =>
    exportReport.mutate({ endpoint, format, filename, params });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || exportReport.isPending}
          />
        }
      >
        <Download className="size-3.5" />
        Export
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport(ReportFormat.Csv)}>
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(ReportFormat.Xlsx)}>
          XLSX
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
