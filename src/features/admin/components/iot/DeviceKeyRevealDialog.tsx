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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DeviceSecrets } from "@/features/admin/components/iot/deviceSecrets";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: DeviceSecrets | null;
  /** Mật khẩu AP của trang cấu hình tại chỗ — in lên nhãn cùng QR. */
  setupApPassword?: string;
  setupPortalUser?: string;
  setupPortalPassword?: string;
}

const localSetupImportUrl =
  import.meta.env.VITE_IOT_SETUP_URL?.trim() ||
  "http://192.168.4.1:8080/import";
const deviceApiUrl = import.meta.env.VITE_IOT_DEVICE_API_URL?.trim() || "";
const deviceMqttHost = import.meta.env.VITE_IOT_MQTT_HOST?.trim() || "";
const configuredMqttPort = Number(import.meta.env.VITE_IOT_MQTT_PORT || 0);

/** Convert the backend's canonical iot:// payload into a URL a phone camera can open. */
function buildScannableProvisioningUrl(
  payload: string,
  device: DeviceSecrets,
): string {
  try {
    const source = new URL(payload);
    const deviceCode = source.searchParams.get("dc");
    const apiKey = source.searchParams.get("key");
    if (
      source.protocol !== "iot:" ||
      source.hostname !== "provision" ||
      !deviceCode ||
      !apiKey
    ) {
      return payload;
    }

    const target = new URL(localSetupImportUrl);
    target.searchParams.set("dc", deviceCode);
    target.searchParams.set("key", apiKey);
    // Identity alone is not enough: an ESP moved to another router must not
    // keep using an IP address from an older network. The deployment supplies
    // a stable DNS/mDNS API endpoint, and the portal persists it with the QR.
    if (deviceApiUrl) target.searchParams.set("api", deviceApiUrl);

    const mqttHost = deviceMqttHost || device.mqttBrokerHost;
    const mqttPort = configuredMqttPort || device.mqttBrokerPort;
    if (mqttHost) target.searchParams.set("mh", mqttHost);
    if (mqttPort) target.searchParams.set("mp", String(mqttPort));
    if (device.mqttUseTls != null) {
      target.searchParams.set("mt", device.mqttUseTls ? "1" : "0");
    }
    return target.toString();
  } catch {
    return payload;
  }
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
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copy}
                aria-label={`Copy ${label}`}
              />
            }
          >
            <Copy className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Copy {label}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export default function DeviceKeyRevealDialog({
  open,
  onOpenChange,
  device,
  setupApPassword = "12345678",
  setupPortalUser = "admin",
  setupPortalPassword = "12345678",
}: Props) {
  const labelRef = useRef<HTMLDivElement>(null);

  if (!device) return null;

  const scannableProvisioningUrl = device.provisioningQrCode
    ? buildScannableProvisioningUrl(device.provisioningQrCode, device)
    : null;

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
      toast.error(
        "The browser blocked the print window. Allow pop-ups and try again.",
      );
      return;
    }
    w.document
      .write(`<!doctype html><html lang="vi"><head><meta charset="utf-8">
<title>Label ${device.deviceCode}</title>
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
          <DialogTitle>Device provisioning details</DialogTitle>
          {/*
            IOT3-74 — cảnh báo cũ ghi "chỉ hiển thị MỘT LẦN" cho TẤT CẢ. Sai với `apiKey`:
            GH-724 lưu plaintext và `GET /{id}` đọc lại được. Nói sai theo hướng bi quan cũng có
            giá: admin lỡ đóng tab sẽ đi xoay khoá — mà xoay khoá thì BẮT BUỘC phải mang cáp ra
            hiện trường nạp lại một thiết bị vốn đang chạy tốt.
          */}
          <DialogDescription>
            You can view this again at any time from the <b>View details</b>{" "}
            button in the device list — except the <b>MQTT password</b> of
            devices created before this update.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          {/* ---- IOT3-72: QR THÀNH HÌNH ---- */}
          {scannableProvisioningUrl ? (
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-lg border bg-white p-3">
                {/*
                  Trước đây chuỗi `iot://provision?...` chỉ nằm trong một ô input — tức là
                  KHÔNG quét được, mà quét chính là lý do nó tồn tại.
                  level="M": chịu được ~15% hỏng bề mặt, đủ cho nhãn dán trong tủ pin bụi bặm.
                */}
                <QRCodeSVG
                  value={scannableProvisioningUrl}
                  size={240}
                  level="M"
                />
              </div>
              <ol className="max-w-60 list-inside list-decimal space-y-1 text-left text-xs text-muted-foreground">
                <li>
                  Connect the phone to the <b>SolarGW-xxxx</b> Wi-Fi network.
                </li>
                <li>
                  Open <b>192.168.4.1:8080</b>, sign in to the portal and pick
                  the customer&apos;s 2.4 GHz Wi-Fi.
                </li>
                <li>
                  Tap <b>Open camera / pick a QR image</b>, then fit this whole
                  code into the frame.
                </li>
                <li>
                  The page reads the QR automatically; the ESP32 saves the
                  configuration, reboots and switches to Active.
                </li>
              </ol>
              <p className="max-w-60 text-center text-2xs leading-relaxed text-muted-foreground">
                No APK needed. When the customer moves or changes router, just
                reconnect to SolarGW and enter the new Wi-Fi; the IoT key is
                kept, so there is no need to scan the QR again.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={printLabel}
              >
                <Printer className="size-3.5" />
                Print 50×30 mm label
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground max-w-56">
              This device was created before the system stored re-readable API
              keys, so the QR code cannot be rebuilt. Use <b>Rotate API key</b>{" "}
              to issue a new one — but note that doing so requires re-flashing
              the device on site.
            </div>
          )}

          <div className="space-y-3 min-w-0">
            {device.apiKey ? (
              <CopyRow label="API Key" value={device.apiKey} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No re-readable API key was stored for this device.
              </p>
            )}
            {scannableProvisioningUrl && (
              <CopyRow
                label="Setup URL encoded in the QR"
                value={scannableProvisioningUrl}
              />
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
                    The MQTT password of this device cannot be read back (it was
                    created before this update). Use <b>Rotate MQTT key</b> —
                    the device fetches a new password itself via
                    <code className="mx-1">/provision</code>, with no site visit
                    needed.
                  </p>
                )}
                <CopyRow
                  label="MQTT Broker Host"
                  value={device.mqttBrokerHost!}
                />
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
                  <CopyRow
                    label="MQTT Topic Prefix"
                    value={device.mqttTopicPrefix}
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                The MQTT bridge is not enabled on the server, so there are no
                broker details to configure the device with. The device can
                still use the API key above.
              </p>
            )}
          </div>
        </div>

        {/* Nguồn HTML cho cửa sổ in — không hiện trên màn hình. */}
        <div className="hidden">
          <div ref={labelRef}>
            <div className="label">
              <div className="qr">
                {scannableProvisioningUrl && (
                  <QRCodeSVG
                    value={scannableProvisioningUrl}
                    size={128}
                    level="M"
                  />
                )}
              </div>
              <div className="info">
                <div className="code">{device.deviceCode}</div>
                <div className="row muted">{device.displayName}</div>
                {/* Tên + mật khẩu AP cấu hình: đúng thứ kỹ thuật viên cần khi khách đổi WiFi
                    và không có mạng để tra cứu. */}
                <div className="row">Setup AP: SolarGW-xxxx</div>
                <div className="row">AP pass: {setupApPassword}</div>
                <div className="row">
                  Portal: {setupPortalUser} / {setupPortalPassword}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
