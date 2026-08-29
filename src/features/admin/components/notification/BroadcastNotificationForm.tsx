import { useMemo, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp, Loader2, Send, Users, X } from "lucide-react";
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
  .sort((a, b) => a.label.localeCompare(b.label, "en"));

// Shared constants for the useWatch fallback branch — see the note inside the component.
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
  // Which groups have their member list expanded. Pure UI state, so it stays in useState and out of
  // the form — it is not part of the payload.
  const [openGroupIds, setOpenGroupIds] = useState<string[]>([]);
  const debouncedUserSearch = useDebounce(userSearch, 300);

  // There are few groups (4 system ones + a handful of custom ones), so a single large page is
  // enough; if it overflows, `totalItems` exceeds the item count and the warning below shows up.
  const { data: groupPage } = useNotificationGroups({ pageSize: 100 });
  const groups = groupPage?.items ?? [];
  const hasMoreGroups = (groupPage?.totalItems ?? 0) > groups.length;

  // Search users SERVER-SIDE — don't fetch `pageSize: 100` and filter on the client.
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

  // Use useWatch, NOT form.watch(): watch() returns a function that the React Compiler can't
  // safely memoize, and eslint rejects it outright (`react-hooks/incompatible-library`).
  //
  // The fallback uses the EMPTY_IDS/EMPTY_CHANNELS constants instead of `?? []`: an inline empty
  // array is a NEW reference on every render, which makes the useMemo below recompute constantly
  // and changes the preview payload identity with it — wasteful, and exactly what
  // react-hooks/exhaustive-deps warns about.
  const groupIds =
    useWatch({ control: form.control, name: "groupIds" }) ?? EMPTY_IDS;
  const userIds =
    useWatch({ control: form.control, name: "userIds" }) ?? EMPTY_IDS;
  const channels =
    useWatch({ control: form.control, name: "channels" }) ?? EMPTY_CHANNELS;
  // Live character count — also via useWatch, for the reason above.
  const titleValue = useWatch({ control: form.control, name: "title" }) ?? "";
  const bodyValue = useWatch({ control: form.control, name: "body" }) ?? "";
  const typeValue =
    useWatch({ control: form.control, name: "type" }) ??
    NotificationTypeEnum.System;
  const useTemplate =
    useWatch({ control: form.control, name: "useTemplate" }) ?? false;
  // Same reason as EMPTY_IDS: an inline empty object is a new reference on every render.
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
      // Blank fields are dropped from the payload: sending an empty string or omitting the key both
      // render as a blank, but omitting it lets the server report "variable has no value" instead
      // of failing silently.
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
      // A 400 "no valid recipients" arrives as an HttpError ⇒ toast with the specific reason.
      handleErrorApi({ error, setError: form.setError });
    }
  };

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* ── Recipients ─────────────────────────────────────────────────────── */}
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-1.5">
          <Users className="size-4" />
          <h2 className="text-sm font-medium">Recipients</h2>
        </div>

        <div className="space-y-1.5">
          <Label>Groups</Label>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {groups.map((g) => {
              const expanded = openGroupIds.includes(g.id);
              return (
                <div
                  key={g.id}
                  className="self-start rounded-md border border-border bg-background text-xs"
                >
                  <div className="flex items-center gap-2 px-2.5 py-1.5">
                    {/* The expand/collapse button must sit OUTSIDE <label>: inside it, clicking it
                        would also tick the group checkbox — the user only wants to see who is in
                        the group, not necessarily select it. */}
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
                          ? `Hide the member list for group ${g.name}`
                          : `See who is in group ${g.name}`
                      }
                      title={expanded ? "Hide list" : "See who is in the group"}
                    >
                      {expanded ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Rendered only when expanded ⇒ the API is called only then. */}
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
              No groups yet. Create one on the “Notification groups” screen.
            </p>
          )}
          {hasMoreGroups && (
            <p className="text-xs text-amber-600">
              The group list is truncated — use the “Notification groups” screen
              to see all of them.
            </p>
          )}
          {errors.groupIds && (
            <p className="text-xs text-red-500">{errors.groupIds.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Add specific people</Label>
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
            placeholder="Search by name or email…"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="h-8"
          />
          {userSearch && (
            <div className="max-h-36 overflow-y-auto rounded-md border border-border bg-background">
              {isSearchingAccounts ? (
                <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                  Searching…
                </p>
              ) : (accountList?.items.length ?? 0) === 0 ? (
                <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                  No matching accounts.
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
                      <Badge variant="secondary" className="text-3xs">
                        selected
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* This number is computed by the BACKEND, with the same logic as the real send — summing
            each group's memberCount here would be wrong when groups overlap. */}
        <div className="rounded-md border border-border bg-background px-3 py-2">
          {groupIds.length === 0 && userIds.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Select groups or people to preview the recipient count.
            </p>
          ) : isPreviewing ? (
            <p className="text-xs text-muted-foreground">Calculating…</p>
          ) : preview ? (
            <div className="space-y-0.5 text-xs">
              <p>
                Will send to{" "}
                <b className="text-sm tabular-nums">{preview.recipientCount}</b>{" "}
                people
                {channels.length > 0 && (
                  <>
                    {" "}
                    ·{" "}
                    <b className="tabular-nums">
                      {preview.notificationCount}
                    </b>{" "}
                    notifications ({channels.length} channels)
                  </>
                )}
              </p>
              {preview.rawCount > preview.recipientCount && (
                <p className="text-muted-foreground">
                  Summing each group gives {preview.rawCount} — the groups you
                  picked share {preview.rawCount - preview.recipientCount}{" "}
                  people, and each person only receives it once.
                </p>
              )}
              {preview.skippedUsers > 0 && (
                <p className="text-amber-600">
                  {preview.skippedUsers} selected people are inactive — they
                  won't receive it.
                </p>
              )}
              {preview.missingGroups > 0 && (
                <p className="text-amber-600">
                  {preview.missingGroups} groups no longer exist.
                </p>
              )}
              {preview.recipientCount === 0 && (
                <p className="text-red-500">
                  No valid recipients left — sending will be rejected.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            Type <span className="text-destructive">*</span>
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
                  <SelectValue placeholder="Select type" />
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
            Channels <span className="text-destructive">*</span>
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
          Title <span className="text-destructive">*</span>{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({titleValue.length}/{BROADCAST_TITLE_MAX})
          </span>
        </Label>
        <Input
          id="bc-title"
          placeholder="e.g. System maintenance tonight at 22:00"
          {...form.register("title")}
        />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bc-body">
          Body <span className="text-destructive">*</span>{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({bodyValue.length}/{BROADCAST_BODY_MAX})
          </span>
        </Label>
        <Textarea
          id="bc-body"
          rows={4}
          placeholder="Notification content sent to recipients"
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
            Use an existing notification template
            <span className="block text-xs font-normal text-muted-foreground">
              Content is built from the template for the selected type, with a
              separate version per channel. Turn this off to send exactly what
              you typed above.
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
        This notification goes through the same delivery path as every other
        notification, so it still respects each recipient's opt-in preferences
        and quiet hours.
      </p>

      <div className="flex justify-end">
        <Button type="submit" disabled={send.isPending}>
          {send.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Send className="mr-2 size-4" />
          )}
          Send notification
        </Button>
      </div>
    </form>
  );
}
