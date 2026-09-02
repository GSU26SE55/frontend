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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CreateGatewayDeviceResponseDto } from "@/features/admin/types/ticket/sms-gateway.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

interface ApiKeyRevealDialogProps {
  device: CreateGatewayDeviceResponseDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fallback copy for non-secure contexts (HTTP/IP) when navigator.clipboard isn't available.
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
          <DialogTitle>Device API key</DialogTitle>
          <DialogDescription>
            Copy it now and paste it into the Flutter app on the phone. This key
            is shown ONLY ONCE — once the dialog closes, it can't be viewed
            again.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            If you lose the key, you'll have to revoke the device and create a
            new one — there's no way to recover it.
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
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    aria-label="Copy API key"
                  />
                }
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {copied ? "Copied!" : "Copy API key"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            I've saved the key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
