import { Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExportReport } from "@/shared/hooks/useReports";
import { ReportFormat } from "@/shared/enums/report.enum";

interface ReportExportMenuProps {
  endpoint: string;
  filename: string; // không kèm đuôi mở rộng
  params?: Record<string, unknown>;
  disabled?: boolean;
}

// Nút Export + dropdown chọn CSV/XLSX. BE trả file qua ?format=, hook tải blob về máy.
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
