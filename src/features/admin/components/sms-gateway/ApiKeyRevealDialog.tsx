import { useState } from "react";
import { Copy, Check, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateGatewayDeviceResponseDto } from "@/features/admin/types/sms-gateway.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

interface ApiKeyRevealDialogProps {
  device: CreateGatewayDeviceResponseDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fallback copy cho non-secure context (HTTP/IP) khi navigator.clipboard không khả dụng.
const fallbackCopy = (text: string): boolean => {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok: boolean;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
};

export default function ApiKeyRevealDialog({
  device,
  open,
  onOpenChange,
}: ApiKeyRevealDialogProps) {
  const [copied, setCopied] = useState(false);

  const markCopied = () => {
    setCopied(true);
    toast.success(ADMIN_MESSAGES.iot.apiKeyCopied);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopy = async () => {
    const key = device?.apiKey ?? "";
    if (!key) return;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(key);
      markCopied();
    } catch {
      if (fallbackCopy(key)) {
        markCopied();
      } else {
        toast.error(ADMIN_MESSAGES.iot.copyManual);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>API key của thiết bị</DialogTitle>
          <DialogDescription>
            Copy ngay và dán vào app Flutter trên điện thoại. Key này chỉ hiển
            thị MỘT LẦN — đóng hộp thoại là không xem lại được.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            Nếu mất key, bạn phải thu hồi thiết bị và tạo lại — không có cách
            khôi phục.
          </span>
        </div>

        <div className="space-y-1">
          <Label htmlFor="reveal-device-code">Device code</Label>
          <Input
            id="reveal-device-code"
            readOnly
            value={device?.deviceCode ?? ""}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="reveal-api-key">API key</Label>
          <div className="flex gap-2">
            <Input
              id="reveal-api-key"
              readOnly
              value={device?.apiKey ?? ""}
              className="font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy API key"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Tôi đã lưu key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
