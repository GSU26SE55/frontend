import { useMemo, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  notificationTypeLabel,
  notificationChannelLabel,
} from "@/shared/constants/notificationLabels";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { handleErrorApi } from "@/shared/lib/errors";
import BroadcastTemplateSection from "@/features/admin/components/notification/BroadcastTemplateSection";
import GroupMemberPeek from "@/features/admin/components/notification/GroupMemberPeek";
import { useAdminAccountList } from "@/features/admin/hooks/account/useAdminAccounts";
import {
  useNotificationGroups,
  useBroadcastPreview,
  useSendBroadcast,
} from "@/features/admin/hooks/notification/useNotificationGroups";
import {
  broadcastFormSchema,
  type BroadcastFormValues,
} from "@/features/admin/schemas/notification/notification-group.schema";
import {
  BROADCAST_TITLE_MAX,
  BROADCAST_BODY_MAX,
} from "@/features/admin/types/notification/notification-group.types";

const TYPE_OPTIONS = Object.values(NotificationTypeEnum)
  .map((value) => ({ value, label: notificationTypeLabel(value) }))
  .sort((a, b) => a.label.localeCompare(b.label, "vi"));

// Hằng số dùng chung cho nhánh fallback của useWatch — xem chú thích trong component.
const EMPTY_IDS: string[] = [];
const EMPTY_CHANNELS: NotificationChannelEnum[] = [];
const EMPTY_VARS: Record<string, string> = {};

const CHANNEL_OPTIONS = Object.values(NotificationChannelEnum).map((value) => ({
  value,
  label: notificationChannelLabel(value),
}));

export default function BroadcastNotificationForm() {
  const send = useSendBroadcast();

  const [userSearch, setUserSearch] = useState("");
  // Nhóm nào đang mở xem danh sách người. Là state UI thuần nên để useState, không đưa vào form —
  // nó không phải dữ liệu gửi đi.
  const [openGroupIds, setOpenGroupIds] = useState<string[]>([]);
  const debouncedUserSearch = useDebounce(userSearch, 300);

  // Nhóm ít (4 hệ thống + vài nhóm tự tạo) nên lấy một trang lớn là đủ; nếu vượt thì
  // `totalItems` sẽ lớn hơn số phần tử và cảnh báo bên dưới hiện ra.
  const { data: groupPage } = useNotificationGroups({ pageSize: 100 });
  const groups = groupPage?.items ?? [];
  const hasMoreGroups = (groupPage?.totalItems ?? 0) > groups.length;

  // Tìm người PHÍA SERVER — không lấy `pageSize: 100` rồi lọc ở client.
  const { data: accountList, isFetching: isSearchingAccounts } =
    useAdminAccountList({
      pageSize: 20,
      keyword: debouncedUserSearch || undefined,
    });

  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: {
      type: NotificationTypeEnum.System,
      channels: [NotificationChannelEnum.InApp],
      title: "",
      body: "",
      groupIds: [],
      userIds: [],
      useTemplate: false,
      templateVars: {},
    },
  });

  // Dùng useWatch chứ KHÔNG dùng form.watch(): watch() trả về một hàm mà React Compiler không
  // memo hoá an toàn được, eslint chặn ngay (`react-hooks/incompatible-library`).
  //
  // Fallback dùng hằng số EMPTY_IDS/EMPTY_CHANNELS chứ KHÔNG viết `?? []`: mảng rỗng viết tại chỗ
  // là một tham chiếu MỚI mỗi lần render, làm useMemo bên dưới tính lại liên tục và payload xem
  // trước cũng đổi định danh theo — lãng phí, và đúng thứ react-hooks/exhaustive-deps cảnh báo.
  const groupIds =
    useWatch({ control: form.control, name: "groupIds" }) ?? EMPTY_IDS;
  const userIds =
    useWatch({ control: form.control, name: "userIds" }) ?? EMPTY_IDS;
  const channels =
    useWatch({ control: form.control, name: "channels" }) ?? EMPTY_CHANNELS;
  // Đếm ký tự trực tiếp — cũng dùng useWatch vì lý do trên.
  const titleValue = useWatch({ control: form.control, name: "title" }) ?? "";
  const bodyValue = useWatch({ control: form.control, name: "body" }) ?? "";
  const typeValue =
    useWatch({ control: form.control, name: "type" }) ??
    NotificationTypeEnum.System;
  const useTemplate =
    useWatch({ control: form.control, name: "useTemplate" }) ?? false;
  // Cùng lý do với EMPTY_IDS: object rỗng viết tại chỗ là tham chiếu mới mỗi lần render.
  const templateVars =
    useWatch({ control: form.control, name: "templateVars" }) ?? EMPTY_VARS;

  const previewPayload = useMemo(
    () => ({ groupIds, userIds, channels }),
    [groupIds, userIds, channels],
  );

  const { data: preview, isFetching: isPreviewing } = useBroadcastPreview(
    previewPayload,
    groupIds.length > 0 || userIds.length > 0,
  );

  const selectedUsers = (accountList?.items ?? []).filter((a) =>
    userIds.includes(a.id),
  );

  const onSubmit = async (values: BroadcastFormValues) => {
    try {
      // Ô để trống bị lược khỏi payload: gửi chuỗi rỗng hay bỏ hẳn khoá đều cho ra chỗ trống lúc
      // render, nhưng bỏ hẳn thì máy chủ báo đúng "biến chưa có giá trị" thay vì im lặng.
      const filledVars = Object.entries(values.templateVars).filter(
        ([, v]) => v.trim().length > 0,
      );

      await send.mutateAsync({
        type: values.type,
        channels: values.channels,
        title: values.title,
        body: values.body,
        groupIds: values.groupIds,
        userIds: values.userIds,
        useTemplate: values.useTemplate,
        payloadJson:
          values.useTemplate && filledVars.length > 0
            ? JSON.stringify(Object.fromEntries(filledVars))
            : null,
      });
      form.reset({
        type: NotificationTypeEnum.System,
        channels: [NotificationChannelEnum.InApp],
        title: "",
        body: "",
        groupIds: [],
        userIds: [],
        useTemplate: false,
        templateVars: {},
      });
      setUserSearch("");
    } catch (error) {
      // 400 "không có người nhận hợp lệ" đến dưới dạng HttpError ⇒ toast kèm lý do cụ thể.
      handleErrorApi({ error, setError: form.setError });
    }
  };

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Người nhận ─────────────────────────────────────────────────────── */}
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-1.5">
          <Users className="size-4" />
          <h2 className="text-sm font-medium">Người nhận</h2>
        </div>

        <div className="space-y-1.5">
          <Label>Nhóm</Label>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {groups.map((g) => {
              const expanded = openGroupIds.includes(g.id);
              return (
                <div
                  key={g.id}
                  className="self-start rounded-md border border-border bg-background text-xs"
                >
                  <div className="flex items-center gap-2 px-2.5 py-1.5">
                    {/* Nút mở/đóng phải nằm NGOÀI <label>: đặt trong thì bấm nó sẽ tick luôn ô
                        chọn nhóm — người dùng chỉ muốn xem có những ai, chưa chắc muốn chọn. */}
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={groupIds.includes(g.id)}
                        onCheckedChange={(v) =>
                          form.setValue(
                            "groupIds",
                            v === true
                              ? [...groupIds, g.id]
                              : groupIds.filter((x) => x !== g.id),
                            { shouldValidate: true },
                          )
                        }
                      />
                      <span className="min-w-0 flex-1 truncate">{g.name}</span>
                    </label>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {g.memberCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroupIds((prev) =>
                          prev.includes(g.id)
                            ? prev.filter((x) => x !== g.id)
                            : [...prev, g.id],
                        )
                      }
                      className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      aria-expanded={expanded}
                      aria-label={
                        expanded
                          ? `Ẩn danh sách người trong nhóm ${g.name}`
                          : `Xem những ai trong nhóm ${g.name}`
                      }
                      title={expanded ? "Ẩn danh sách" : "Xem những ai trong nhóm"}
                    >
                      {expanded ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Chỉ render khi mở ⇒ chỉ lúc đó mới gọi API. */}
                  {expanded && (
                    <GroupMemberPeek
                      groupId={g.id}
                      memberCount={g.memberCount}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {groups.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Chưa có nhóm nào. Tạo nhóm ở màn hình “Nhóm nhận thông báo”.
            </p>
          )}
          {hasMoreGroups && (
            <p className="text-xs text-amber-600">
              Danh sách nhóm bị cắt bớt — dùng màn hình “Nhóm nhận thông báo” để
              xem đầy đủ.
            </p>
          )}
          {errors.groupIds && (
            <p className="text-xs text-red-500">{errors.groupIds.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Thêm người cụ thể (tuỳ chọn)</Label>
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedUsers.map((a) => (
                <Badge key={a.id} variant="secondary" className="gap-1 text-xs">
                  {a.fullName}
                  <button
                    type="button"
                    onClick={() =>
                      form.setValue(
                        "userIds",
                        userIds.filter((x) => x !== a.id),
                        { shouldValidate: true },
                      )
                    }
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Input
            placeholder="Tìm theo tên hoặc email…"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="h-8"
          />
          {userSearch && (
            <div className="max-h-36 overflow-y-auto rounded-md border border-border bg-background">
              {isSearchingAccounts ? (
                <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                  Đang tìm…
                </p>
              ) : (accountList?.items.length ?? 0) === 0 ? (
                <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                  Không tìm thấy tài khoản.
                </p>
              ) : (
                accountList!.items.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      form.setValue(
                        "userIds",
                        userIds.includes(a.id)
                          ? userIds.filter((x) => x !== a.id)
                          : [...userIds, a.id],
                        { shouldValidate: true },
                      )
                    }
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-muted"
                  >
                    <span>
                      {a.fullName}{" "}
                      <span className="text-muted-foreground">— {a.email}</span>
                    </span>
                    {userIds.includes(a.id) && (
                      <Badge variant="secondary" className="text-[10px]">
                        đã chọn
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Con số này do BACKEND tính, bằng chính đoạn logic của lần gửi thật — cộng
            memberCount từng nhóm ở đây sẽ sai khi các nhóm giao nhau. */}
        <div className="rounded-md border border-border bg-background px-3 py-2">
          {groupIds.length === 0 && userIds.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Chọn nhóm hoặc người để xem trước số người nhận.
            </p>
          ) : isPreviewing ? (
            <p className="text-xs text-muted-foreground">Đang tính…</p>
          ) : preview ? (
            <div className="space-y-0.5 text-xs">
              <p>
                Sẽ gửi tới{" "}
                <b className="text-sm tabular-nums">{preview.recipientCount}</b>{" "}
                người
                {channels.length > 0 && (
                  <>
                    {" "}
                    ·{" "}
                    <b className="tabular-nums">
                      {preview.notificationCount}
                    </b>{" "}
                    thông báo ({channels.length} kênh)
                  </>
                )}
              </p>
              {preview.rawCount > preview.recipientCount && (
                <p className="text-muted-foreground">
                  Cộng dồn từng nhóm là {preview.rawCount} — các nhóm bạn chọn
                  có {preview.rawCount - preview.recipientCount} người trùng
                  nhau, mỗi người chỉ nhận một lần.
                </p>
              )}
              {preview.skippedUsers > 0 && (
                <p className="text-amber-600">
                  {preview.skippedUsers} người được chọn đang ngừng hoạt động —
                  sẽ không nhận được.
                </p>
              )}
              {preview.missingGroups > 0 && (
                <p className="text-amber-600">
                  {preview.missingGroups} nhóm không còn tồn tại.
                </p>
              )}
              {preview.recipientCount === 0 && (
                <p className="text-red-500">
                  Không còn người nhận hợp lệ nào — gửi sẽ bị từ chối.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Nội dung ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            Loại <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="type"
            control={form.control}
            render={({ field }) => (
              <Select
                value={String(field.value)}
                items={TYPE_OPTIONS.map((o) => ({
                  value: String(o.value),
                  label: o.label,
                }))}
                onValueChange={(v) => v && field.onChange(Number(v))}
              >
                <SelectTrigger className="w-full">
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
            Kênh gửi <span className="text-red-500">*</span>
          </Label>
          <div className="flex flex-wrap gap-3 pt-1.5">
            {CHANNEL_OPTIONS.map((c) => (
              <label
                key={c.value}
                className="flex cursor-pointer items-center gap-1.5 text-xs"
              >
                <Checkbox
                  checked={channels.includes(c.value)}
                  onCheckedChange={(v) =>
                    form.setValue(
                      "channels",
                      v === true
                        ? [...channels, c.value]
                        : channels.filter((x) => x !== c.value),
                      { shouldValidate: true },
                    )
                  }
                />
                {c.label}
              </label>
            ))}
          </div>
          {errors.channels && (
            <p className="text-xs text-red-500">{errors.channels.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bc-title">
          Tiêu đề <span className="text-red-500">*</span>{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({titleValue.length}/{BROADCAST_TITLE_MAX})
          </span>
        </Label>
        <Input
          id="bc-title"
          placeholder="VD: Bảo trì hệ thống 22:00 hôm nay"
          {...form.register("title")}
        />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bc-body">
          Nội dung <span className="text-red-500">*</span>{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({bodyValue.length}/{BROADCAST_BODY_MAX})
          </span>
        </Label>
        <Textarea
          id="bc-body"
          rows={4}
          placeholder="Nội dung thông báo gửi tới người nhận"
          {...form.register("body")}
        />
        {errors.body && (
          <p className="text-xs text-red-500">{errors.body.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-start gap-2">
          <Checkbox
            checked={useTemplate}
            onCheckedChange={(v) =>
              form.setValue("useTemplate", v === true, { shouldValidate: true })
            }
            className="mt-0.5"
          />
          <span className="text-sm">
            Dùng mẫu thông báo có sẵn
            <span className="block text-xs font-normal text-muted-foreground">
              Nội dung dựng từ mẫu của loại đang chọn, mỗi kênh một bản riêng.
              Tắt thì gửi đúng chữ bạn gõ ở trên.
            </span>
          </span>
        </label>

        {useTemplate && (
          <BroadcastTemplateSection
            type={typeValue}
            channels={channels}
            title={titleValue}
            body={bodyValue}
            vars={templateVars}
            onVarChange={(name, value) =>
              form.setValue(
                "templateVars",
                { ...templateVars, [name]: value },
                { shouldDirty: true },
              )
            }
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Thông báo đi qua đúng đường giao của mọi thông báo khác, nên vẫn tôn
        trọng tuỳ chọn nhận tin và khung giờ yên tĩnh của từng người.
      </p>

      <Button type="submit" disabled={send.isPending}>
        {send.isPending ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Send className="mr-2 size-4" />
        )}
        Gửi thông báo
      </Button>
    </form>
  );
}
