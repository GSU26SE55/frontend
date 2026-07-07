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
} from "@/shared/enums/notification.enum";
import {
  createNotificationSchema,
  type CreateNotificationFormValues,
} from "@/features/admin/schemas/notification.schema";
import { useCreateNotification } from "@/features/admin/hooks/useCreateNotification";
import { useAdminAccountList } from "@/features/admin/hooks/useAdminAccounts";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AccountDto } from "@/shared/types/account.types";

// Map int → nhãn (inline theo pattern repo — không có util chung)
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
  { value: NotificationTypeEnum.AdminInvite, label: "Admin Invite" },
  { value: NotificationTypeEnum.IncidentDeclared, label: "Incident Declared" },
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
    label: "IoT Device Went Offline",
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
      toast.success("Tạo notification thành công");
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
          Người nhận <span className="text-red-500">*</span>
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
                    isLoadingAccounts ? "Đang tải user..." : "Chọn user nhận"
                  }
                />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <div className="p-1.5">
                  <Input
                    placeholder="Tìm theo tên hoặc email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="h-8"
                  />
                </div>
                {accounts.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                    {isLoadingAccounts ? "Đang tải..." : "Không tìm thấy user"}
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
        <p className="text-[11px] text-muted-foreground">
          Chọn user từ danh sách tài khoản — không cần nhập UUID thủ công.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            Loại <span className="text-red-500">*</span>
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
                  <SelectValue placeholder="Chọn loại" />
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
            Kênh <span className="text-red-500">*</span>
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
                  <SelectValue placeholder="Chọn kênh" />
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
          Tiêu đề <span className="text-red-500">*</span>
        </Label>
        <Input
          id="notif-title"
          placeholder="Tiêu đề notification"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notif-body">
          Nội dung <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="notif-body"
          rows={4}
          placeholder="Nội dung notification"
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
          placeholder="VD: Ticket, Battery (tùy chọn)"
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
          Bypass quiet hours (chỉ cho channel Critical)
        </Label>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Tạo notification
      </Button>
    </form>
  );
}
