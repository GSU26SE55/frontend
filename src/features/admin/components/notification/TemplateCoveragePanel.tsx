import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTemplateCoverage } from "@/features/admin/hooks/notification/useNotificationTemplates";
import {
  notificationTypeLabel,
  notificationChannelLabel,
} from "@/shared/constants/notificationLabels";

/**
 * Đối chiếu mẫu đang có với **thông báo thật đã gửi**.
 *
 * Vì sao đo theo thông báo thật chứ không theo cấu hình: hai thứ đó từng lệch nhau. Consumer pin
 * gửi qua cả SMS trong khi bảng cấu hình kênh không khai SMS, nên 98 tin SMS đã gửi đi mà không mẫu
 * nào phủ — chỉ dữ liệu thật mới lộ ra khoảng trống đó.
 *
 * Hai thứ bảng này trả lời:
 *  - Cặp nào đang gửi bằng **chữ ghi cứng trong code** (chưa có mẫu) ⇒ muốn sửa câu chữ phải deploy.
 *  - Mẫu nào đang gọi **biến không tồn tại** ⇒ chỗ đó hiện ra rỗng khi gửi.
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
                ? `Đủ mẫu cho cả ${tong} cặp (loại × kênh) đang gửi`
                : `${canhBao}/${tong} cặp đang gửi cần xử lý`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {canhBao === 0 ? (
                <>
                  Mọi thông báo đang gửi đều lấy nội dung từ mẫu, và không mẫu
                  nào gọi biến không tồn tại.
                </>
              ) : (
                <>
                  {thieuMau.length > 0 && (
                    <>
                      <b>{thieuMau.length}</b> cặp chưa có mẫu — đang dùng chữ
                      ghi cứng trong code, sửa câu chữ phải deploy lại.{" "}
                    </>
                  )}
                  {mauHong.length > 0 && (
                    <>
                      <b>{mauHong.length}</b> mẫu gọi biến không tồn tại — chỗ đó
                      hiện ra rỗng khi gửi.
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
                <ChevronUp className="size-3.5" /> Thu gọn
              </>
            ) : (
              <>
                <ChevronDown className="size-3.5" /> Xem chi tiết
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
                <th className="pb-1.5 pr-3 font-medium">Loại thông báo</th>
                <th className="pb-1.5 pr-3 font-medium">Kênh</th>
                <th className="pb-1.5 pr-3 font-medium text-right">Đã gửi</th>
                <th className="pb-1.5 font-medium">Vấn đề</th>
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
                        Chưa có mẫu
                      </Badge>
                    ) : (
                      <span className="text-xs">
                        Biến không tồn tại:{" "}
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
