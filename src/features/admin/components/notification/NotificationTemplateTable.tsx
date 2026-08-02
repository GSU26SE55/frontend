import { Eye, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { NotificationTemplateDto } from "@/features/admin/types/notification/notification-template.types";

interface Props {
  templates: NotificationTemplateDto[];
  isLoading: boolean;
  activatingId?: string | null;
  onPreview: (template: NotificationTemplateDto) => void;
  onActivate: (template: NotificationTemplateDto) => void;
}

export default function NotificationTemplateTable({
  templates,
  isLoading,
  activatingId,
  onPreview,
  onActivate,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        Không có template nào khớp bộ lọc.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            <th className="px-4 py-2.5 font-medium">Loại</th>
            <th className="px-3 py-2.5 font-medium">Kênh</th>
            <th className="px-3 py-2.5 font-medium">Ngôn ngữ</th>
            <th className="px-3 py-2.5 font-medium text-center">Phiên bản</th>
            <th className="px-3 py-2.5 font-medium">Tiêu đề</th>
            <th className="px-3 py-2.5 font-medium">Cập nhật</th>
            <th className="px-3 py-2.5 font-medium text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {templates.map((t) => (
            <tr key={t.id} className="hover:bg-muted/30">
              <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                {t.type}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">{t.channel}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{t.locale}</td>
              <td className="px-3 py-2.5 text-center whitespace-nowrap">
                <span className="tabular-nums">v{t.version}</span>
                {t.isActive && (
                  <Badge className="ml-2 text-[10px]">Đang dùng</Badge>
                )}
              </td>
              <td className="px-3 py-2.5 max-w-70">
                <span className="line-clamp-1" title={t.titleTemplate}>
                  {t.titleTemplate}
                </span>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground text-xs">
                {format(
                  new Date(t.updatedAt ?? t.createdAt),
                  "dd/MM/yyyy HH:mm",
                )}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPreview(t)}
                  >
                    <Eye className="size-3.5" />
                    Xem trước
                  </Button>
                  {/* Chỉ bản chưa active mới có gì để kích hoạt (quay lui phiên bản). */}
                  {!t.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activatingId === t.id}
                      onClick={() => onActivate(t)}
                    >
                      <Power className="size-3.5" />
                      {activatingId === t.id ? "Đang bật…" : "Kích hoạt"}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
