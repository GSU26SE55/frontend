import { useState } from "react";
import { Loader2, Settings, ShieldAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminPushTransport,
  useAdminUpdatePushTransport,
} from "@/features/admin/hooks/notification/useCreateNotification";
import { PushTransportEnum } from "@/shared/types/notification/notification.types";

export default function PushTransportSettingsForm() {
  const { data: config, isLoading: isGetLoading } = useAdminPushTransport();
  const updateMutation = useAdminUpdatePushTransport();

  // User-picked value (null cho tới khi user tự chọn) — mặc định hiển thị theo
  // config.transport hiện tại của server, không sync qua effect.
  const [pickedTransport, setPickedTransport] = useState<string | null>(null);
  const selectedTransport =
    pickedTransport ?? (config?.transport ? String(config.transport) : "");

  const activeOption = config?.options.find(
    (opt) => String(opt.value) === selectedTransport,
  );

  const handleSave = () => {
    if (!selectedTransport) return;
    updateMutation.mutate({
      transport: Number(selectedTransport) as PushTransportEnum,
    });
  };

  if (isGetLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
        <Loader2 className="animate-spin size-4" />
        Loading system push settings...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <Settings className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          System Push Notification Strategy
        </h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="push-transport-select"
            className="text-xs font-semibold"
          >
            Active Transport Channel
          </Label>
          <div className="flex items-center gap-3">
            <Select
              value={selectedTransport}
              onValueChange={setPickedTransport}
            >
              <SelectTrigger
                id="push-transport-select"
                className="w-full sm:w-80"
              >
                <SelectValue placeholder="Select transport channel" />
              </SelectTrigger>
              <SelectContent>
                {config?.options.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {config?.transport === Number(selectedTransport) && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20">
                <Check className="size-3" /> Active
              </span>
            )}
          </div>
        </div>

        {activeOption && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg border border-border/80 bg-muted/40 text-xs space-y-1">
              <span className="font-semibold block text-foreground">
                Description:
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {activeOption.description}
              </p>
            </div>

            {activeOption.requiresDeviceToken && (
              <div className="flex gap-2.5 p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
                <ShieldAlert className="size-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <strong>Important Notice:</strong> Expo Push API transport
                  requires native devices to register valid mobile tokens
                  (`device-tokens` endpoint). System notifications will fail to
                  deliver to users who have push services disabled on their
                  phones or do not have valid tokens.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2 border-t border-border/40">
        <Button
          onClick={handleSave}
          disabled={
            updateMutation.isPending ||
            !selectedTransport ||
            config?.transport === Number(selectedTransport)
          }
          size="sm"
          className="h-9 px-4 text-xs font-semibold"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="animate-spin size-3.5 mr-2" />
              Saving Settings...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  );
}
