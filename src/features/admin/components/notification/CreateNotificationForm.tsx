import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NotificationTypeEnum,
  NotificationChannelEnum,
} from "@/shared/enums/notification/notification.enum";
import {
  createNotificationSchema,
  type CreateNotificationFormValues,
} from "@/features/admin/schemas/notification/notification.schema";
import { useCreateNotification } from "@/features/admin/hooks/notification/useCreateNotification";
import { useAdminAccountList } from "@/features/admin/hooks/account/useAdminAccounts";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AccountDto } from "@/shared/types/account/account.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

// Map int → label (inline, following the repo pattern — there is no shared util)
const TYPE_OPTIONS: { value: NotificationTypeEnum; label: string }[] = [
  { value: NotificationTypeEnum.TicketCreated, label: "Ticket Created" },
  { value: NotificationTypeEnum.TicketAssigned, label: "Ticket Assigned" },
  {
    value: NotificationTypeEnum.TicketStatusChanged,
    label: "Ticket Status Changed",
  },
  { value: NotificationTypeEnum.TicketResolved, label: "Ticket Resolved" },
  { value: NotificationTypeEnum.TicketClosed, label: "Ticket Closed" },
  { value: NotificationTypeEnum.TicketEscalated, label: "Ticket Escalated" },
  { value: NotificationTypeEnum.SlaWarning, label: "SLA Warning" },
  { value: NotificationTypeEnum.SlaBreached, label: "SLA Breached" },
  {
    value: NotificationTypeEnum.BatteryAnomalyDetected,
    label: "Battery Anomaly Detected",
  },
  {
    value: NotificationTypeEnum.EnvironmentalIncidentDetected,
    label: "Environmental Incident Detected",
  },
  {
    value: NotificationTypeEnum.EnvironmentalIncidentResolved,
    label: "Environmental Incident Resolved",
  },
  { value: NotificationTypeEnum.AccountActivated, label: "Account Activated" },
  { value: NotificationTypeEnum.IncidentDeclared, label: "Incident Declared" },
  {
    value: NotificationTypeEnum.CascadeRiskHigh,
    label: "Cascade Risk High",
  },
  {
    value: NotificationTypeEnum.BatteryAlertEscalationPending,
    label: "Battery Alert Escalation Pending",
  },
  {
    value: NotificationTypeEnum.AlertTicketSagaFailed,
    label: "Alert-Ticket Saga Failed",
  },
  {
    value: NotificationTypeEnum.IotDeviceWentOffline,
    label: "Device Went Offline",
  },
  { value: NotificationTypeEnum.System, label: "System" },
];

const CHANNEL_OPTIONS: { value: NotificationChannelEnum; label: string }[] = [
  { value: NotificationChannelEnum.Push, label: "Push" },
  { value: NotificationChannelEnum.Email, label: "Email" },
  { value: NotificationChannelEnum.Sms, label: "SMS" },
  { value: NotificationChannelEnum.InApp, label: "In-App" },
];

export default function CreateNotificationForm() {
  const { mutateAsync, isPending } = useCreateNotification();
  const [userSearch, setUserSearch] = useState("");
  const debouncedUserSearch = useDebounce(userSearch, 300);
  const { data: accountList, isLoading: isLoadingAccounts } =
    useAdminAccountList({
      pageSize: 100,
      keyword: debouncedUserSearch || undefined,
    });
  const accounts: AccountDto[] = accountList?.items ?? [];

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateNotificationFormValues>({
    resolver: zodResolver(createNotificationSchema),
    defaultValues: {
      channel: NotificationChannelEnum.InApp,
      bypassQuietHours: false,
    },
  });

  const onSubmit = async (data: CreateNotificationFormValues) => {
    try {
      await mutateAsync({
        userId: data.userId,
        type: data.type,
        channel: data.channel,
        title: data.title,
        body: data.body,
        entityType: data.entityType || undefined,
        bypassQuietHours: data.bypassQuietHours,
      });
      toast.success(ADMIN_MESSAGES.notification.created);
      reset({
        channel: NotificationChannelEnum.InApp,
        bypassQuietHours: false,
      });
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div className="space-y-1.5">
        <Label>
          Recipient <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="userId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? ""}
              items={accounts.map((a) => ({
                value: a.id,
                label: `${a.fullName} — ${a.email}`,
              }))}
              onValueChange={field.onChange}
              disabled={isLoadingAccounts}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingAccounts
                      ? "Loading users..."
                      : "Select a recipient"
                  }
                />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <div className="p-1.5">
                  <Input
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="h-8"
                  />
                </div>
                {accounts.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                    {isLoadingAccounts ? "Loading..." : "No matching users"}
                  </p>
                ) : (
                  accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.fullName} — {a.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.userId && (
          <p className="text-xs text-red-500">{errors.userId.message}</p>
        )}
        <p className="text-2xs text-muted-foreground">
          Pick a user from the account list — no need to type a UUID by hand.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            Type <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value != null ? String(field.value) : ""}
                items={TYPE_OPTIONS.map((o) => ({
                  value: String(o.value),
                  label: o.label,
                }))}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && (
            <p className="text-xs text-red-500">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>
            Channel <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="channel"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value != null ? String(field.value) : ""}
                items={CHANNEL_OPTIONS.map((o) => ({
                  value: String(o.value),
                  label: o.label,
                }))}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {CHANNEL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.channel && (
            <p className="text-xs text-red-500">{errors.channel.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notif-title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="notif-title"
          placeholder="Notification title"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notif-body">
          Body <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="notif-body"
          rows={4}
          placeholder="Notification body"
          {...register("body")}
        />
        {errors.body && (
          <p className="text-xs text-red-500">{errors.body.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notif-entityType">Entity Type</Label>
        <Input
          id="notif-entityType"
          placeholder="e.g. Ticket, Battery"
          {...register("entityType")}
        />
        {errors.entityType && (
          <p className="text-xs text-red-500">{errors.entityType.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Controller
          name="bypassQuietHours"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="notif-bypass"
              checked={!!field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
            />
          )}
        />
        <Label htmlFor="notif-bypass" className="cursor-pointer">
          Bypass quiet hours (Critical channel only)
        </Label>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Create notification
      </Button>
    </form>
  );
}
