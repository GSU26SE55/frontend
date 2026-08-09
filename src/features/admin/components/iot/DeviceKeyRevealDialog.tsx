import { useRef } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { DeviceSecrets } from "@/features/admin/components/iot/deviceSecrets";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: DeviceSecrets | null;
  /** Mật khẩu AP của trang cấu hình tại chỗ — in lên nhãn cùng QR. */
  setupApPassword?: string;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`Copied ${label}`);
  };
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={value} readOnly className="font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" onClick={copy}>
          <Copy className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default function DeviceKeyRevealDialog({
  open,
  onOpenChange,
  device,
  setupApPassword = "solar-setup-2026",
}: Props) {
  const labelRef = useRef<HTMLDivElement>(null);

  if (!device) return null;

  /**
   * IOT3-75 — in nhãn 50×30 mm.
   *
   * ⚠️ VẪN GIỮ NHÃN GIẤY dù đã có trang admin. Lúc khách đổi mật khẩu WiFi, kỹ thuật viên đứng
   * trước tủ pin có thể KHÔNG có mạng để mở web admin — mà chính lúc đó mới cần QR nhất. UI này
   * là để IN RA nhãn, không phải để thay thế nhãn.
   *
   * Mở cửa sổ riêng thay vì `@media print` trên trang hiện tại: in cả trang admin ra khổ 50×30
   * sẽ kéo theo sidebar, bảng, dialog — và không có cách nào ẩn hết cho chắc.
   */
  const printLabel = () => {
    const html = labelRef.current?.innerHTML;
    if (!html) return;
    const w = window.open("", "_blank", "width=420,height=320");
    if (!w) {
      toast.error("Trình duyệt đã chặn cửa sổ in. Hãy cho phép pop-up rồi thử lại.");
      return;
    }
    w.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8">
<title>Nhãn ${device.deviceCode}</title>
<style>
  /* Khổ nhãn thật — đặt ở @page thì máy in nhãn mới không tự co về A4. */
  @page { size: 50mm 30mm; margin: 0; }
  html, body { margin: 0; padding: 0; }
  .label {
    width: 50mm; height: 30mm; box-sizing: border-box;
    padding: 1.5mm; display: flex; gap: 1.5mm; align-items: center;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #000;
  }
  .qr { flex: 0 0 auto; }
  .qr svg { width: 26mm; height: 26mm; display: block; }
  .info { flex: 1; min-width: 0; }
  .code { font-family: ui-monospace, monospace; font-size: 8pt; font-weight: 700; }
  .row { font-size: 5.5pt; line-height: 1.35; word-break: break-all; }
  .muted { color: #444; }
</style></head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    // Ảnh QR là SVG nội tuyến nên đã có sẵn khi document.close() — không cần chờ tải.
    w.print();
    w.close();
  };

  const hasBroker = !!device.mqttBrokerHost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thông tin nạp thiết bị</DialogTitle>
          {/*
            IOT3-74 — cảnh báo cũ ghi "chỉ hiển thị MỘT LẦN" cho TẤT CẢ. Sai với `apiKey`:
            GH-724 lưu plaintext và `GET /{id}` đọc lại được. Nói sai theo hướng bi quan cũng có
            giá: admin lỡ đóng tab sẽ đi xoay khoá — mà xoay khoá thì BẮT BUỘC phải mang cáp ra
            hiện trường nạp lại một thiết bị vốn đang chạy tốt.
          */}
          <DialogDescription>
            Xem lại được bất cứ lúc nào qua nút <b>Xem lại thông tin</b> trong danh sách thiết
            bị — trừ <b>mật khẩu MQTT</b> của các thiết bị tạo trước bản cập nhật này.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          {/* ---- IOT3-72: QR THÀNH HÌNH ---- */}
          {device.provisioningQrCode ? (
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-lg border bg-white p-3">
                {/*
                  Trước đây chuỗi `iot://provision?...` chỉ nằm trong một ô input — tức là
                  KHÔNG quét được, mà quét chính là lý do nó tồn tại.
                  level="M": chịu được ~15% hỏng bề mặt, đủ cho nhãn dán trong tủ pin bụi bặm.
                */}
                <QRCodeSVG value={device.provisioningQrCode} size={200} level="M" />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={printLabel}>
                <Printer className="size-3.5" />
                In nhãn 50×30 mm
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground max-w-56">
              Thiết bị này được tạo trước khi hệ thống lưu API key dạng đọc lại được, nên không
              dựng lại được mã QR. Dùng <b>Xoay API key</b> để cấp khoá mới — nhưng nhớ rằng thao
              tác đó bắt buộc phải nạp lại thiết bị tại chỗ.
            </div>
          )}

          <div className="space-y-3 min-w-0">
            {device.apiKey ? (
              <CopyRow label="API Key" value={device.apiKey} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Chưa lưu API key dạng đọc lại được cho thiết bị này.
              </p>
            )}
            {device.provisioningQrCode && (
              <CopyRow label="Chuỗi QR" value={device.provisioningQrCode} />
            )}

            {/*
              Cả sáu trường MQTT cùng rỗng khi bridge chưa bật (`MqttBrokerEndpoint.Disabled`),
              nên xử lý như MỘT đơn vị: hoặc đủ để cấu hình, hoặc nói thẳng là chưa có.

              Trước đây host/port render vô điều kiện: ô "Broker Host" trống (React còn cảnh báo
              `value` prop is null) và ô "Broker Port" hiện đúng chữ "null" do `String(null)` —
              người vận hành copy nguyên chuỗi đó vào firmware.
            */}
            {hasBroker ? (
              <>
                {device.mqttUsername && (
                  <CopyRow label="MQTT Username" value={device.mqttUsername} />
                )}
                {device.mqttPassword ? (
                  <CopyRow label="MQTT Password" value={device.mqttPassword} />
                ) : (
                  <p className="text-sm text-amber-600">
                    Mật khẩu MQTT của thiết bị này không đọc lại được (tạo trước bản cập nhật).
                    Dùng <b>Xoay khoá MQTT</b> — thiết bị tự lấy mật khẩu mới qua
                    <code className="mx-1">/provision</code>, không cần ra hiện trường.
                  </p>
                )}
                <CopyRow label="MQTT Broker Host" value={device.mqttBrokerHost!} />
                <CopyRow
                  label="MQTT Broker Port"
                  value={String(device.mqttBrokerPort ?? "")}
                />
                {/* Hai giá trị này tồn tại để KHỎI phải suy đoán: thiếu chúng thì người cấu
                    hình vẫn đoán TLS theo số cổng, và vẫn gõ tiền tố topic theo deviceCode
                    nguyên bản chữ hoa — broker so khớp topic phân biệt hoa/thường nên thiết bị
                    bị từ chối dù credential hoàn toàn đúng. */}
                {device.mqttUseTls !== null && (
                  <CopyRow
                    label="MQTT TLS"
                    value={device.mqttUseTls ? "true" : "false"}
                  />
                )}
                {device.mqttTopicPrefix && (
                  <CopyRow label="MQTT Topic Prefix" value={device.mqttTopicPrefix} />
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                MQTT bridge chưa được bật trên máy chủ, nên chưa có thông tin broker để cấu hình
                thiết bị. Thiết bị vẫn dùng được API Key ở trên.
              </p>
            )}
          </div>
        </div>

        {/* Nguồn HTML cho cửa sổ in — không hiện trên màn hình. */}
        <div className="hidden">
          <div ref={labelRef}>
            <div className="label">
              <div className="qr">
                {device.provisioningQrCode && (
                  <QRCodeSVG value={device.provisioningQrCode} size={128} level="M" />
                )}
              </div>
              <div className="info">
                <div className="code">{device.deviceCode}</div>
                <div className="row muted">{device.displayName}</div>
                {/* Tên + mật khẩu AP cấu hình: đúng thứ kỹ thuật viên cần khi khách đổi WiFi
                    và không có mạng để tra cứu. */}
                <div className="row">Setup AP: SolarGW-xxxx</div>
                <div className="row">Mật khẩu: {setupApPassword}</div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
