import { useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDate, formatDateTime } from "@/shared/utils/datetime";
import {
  Loader2,
  Camera,
  ShieldCheck,
  Phone,
  Mail,
  Clock,
  CalendarDays,
  Briefcase,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useFileBlobUrl } from "@/shared/hooks/file/useFileBlobUrl";
import { DatePicker } from "@/shared/components/ui/DatePicker";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/features/auth/schemas/profile/profile.schema";
import { useProfile } from "@/features/auth/hooks/profile/useProfile";
import { useUpdateProfile } from "@/features/auth/hooks/profile/useUpdateProfile";
import { useUpdateAvatar } from "@/features/auth/hooks/profile/useUpdateAvatar";
import { useUploadFile } from "@/shared/hooks/file/useUploadFile";
import { FilePurposeEnum } from "@/shared/types/file/file-storage.types";
import { handleErrorApi } from "@/shared/lib/errors";
import { toLocalPhone } from "@/shared/lib/phone";
import { AccountStatusEnum } from "@/shared/enums/account/account.enum";
import { AUTH_MESSAGES } from "@/features/auth/constants/messages";

// ── Maps ─────────────────────────────────────────────────────────────────────
// "Staff" everywhere: the JWT, the sidebar, the account table and the permission matrix all
// say Staff, so labelling the same person "Technician" only on their own profile read as a
// second, different role. (The Technician role in the seeder is marked Deprecated.)
const ROLE_LABEL: Record<string, string> = {
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
  Customer: "Customer",
};

const STATUS_CONFIG: Record<
  number,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  [AccountStatusEnum.PendingVerification]: {
    label: "Pending verification",
    variant: "outline",
  },
  [AccountStatusEnum.Active]: { label: "Active", variant: "default" },
  [AccountStatusEnum.Locked]: { label: "Locked", variant: "destructive" },
  [AccountStatusEnum.Inactive]: {
    label: "Inactive",
    variant: "secondary",
  },
  [AccountStatusEnum.Suspended]: {
    label: "Suspended",
    variant: "destructive",
  },
  [AccountStatusEnum.Banned]: { label: "Banned", variant: "destructive" },
};

const TIER_LABEL: Record<number, string> = {
  1: "Tier 1 — Junior",
  2: "Tier 2 — Senior",
  3: "Tier 3 — Expert",
};

// ── Component ─────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: account, isLoading } = useProfile();
  const { mutateAsync: updateProfile, isPending: isUpdating } =
    useUpdateProfile();
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutate: updateAvatar, isPending: isAvatarUpdating } =
    useUpdateAvatar();

  const avatarFileId = account?.profile?.avatarFileId;
  const { data: avatarUrl } = useFileBlobUrl(avatarFileId);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: account
      ? {
          fullName: account.fullName ?? "",
          phoneNumber: toLocalPhone(account.phoneNumber),
          address: account.address ?? "",
          birthDate: account.dateOfBirth
            ? account.dateOfBirth.slice(0, 10)
            : "",
          timeZone: account.profile?.timeZone ?? "",
        }
      : undefined,
  });

  const initials = (account?.fullName ?? "?")
    .split(" ")
    .slice(-2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // The BE reads an omitted key as "keep the stored value", so that a client which does
      // not render a field cannot wipe it. Address is editable here, so clearing it has to
      // be said explicitly with "". birthDate is a DateTime? — cleared via its own flag.
      // timeZone is a fixed deployment constant with no editor on any client: send it only
      // when we actually have one, never "" (which would blank the stored Asia/Ho_Chi_Minh).
      await updateProfile({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || undefined,
        address: data.address ?? "",
        birthDate: data.birthDate || undefined,
        clearBirthDate: !data.birthDate,
        timeZone: data.timeZone || undefined,
      });
      toast.success(AUTH_MESSAGES.profile.updated);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(
      { file, purpose: FilePurposeEnum.Avatar },
      {
        onSuccess: (res) => {
          if (!res.isSuccess || !res.data) {
            toast.error(AUTH_MESSAGES.profile.avatarUploadFailed);
            return;
          }
          updateAvatar(
            { avatarFileId: res.data.fileId },
            {
              onSuccess: () =>
                toast.success(AUTH_MESSAGES.profile.avatarUpdated),
              onError: (err) => handleErrorApi({ error: err }),
            },
          );
        },
        onError: (err) => handleErrorApi({ error: err }),
      },
    );
    e.target.value = "";
  };

  const isAvatarBusy = isUploading || isAvatarUpdating;
  const statusCfg = account
    ? (STATUS_CONFIG[account.status] ?? {
        label: String(account.status),
        variant: "outline" as const,
      })
    : null;

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer size="narrow">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-4 w-32" />
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-lg" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Profile banner ── */}
      <div className="flex items-center gap-5 p-5 rounded-xl bg-muted/40 border border-border/60">
        {/* Avatar — entire circular area is clickable */}
        <button
          type="button"
          disabled={isAvatarBusy}
          onClick={() => fileInputRef.current?.click()}
          className="relative shrink-0 rounded-full group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Change avatar"
        >
          <Avatar className="size-18 text-2xl ring-2 ring-background shadow-sm">
            {avatarUrl && (
              <AvatarImage
                src={avatarUrl}
                alt={account?.fullName ?? "Avatar"}
              />
            )}
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Hover overlay — dashed border + camera icon in the middle */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/60 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {isAvatarBusy ? (
              <Loader2 size={20} className="text-white animate-spin" />
            ) : (
              <Camera size={20} className="text-white" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </button>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-lg font-semibold truncate">
              {account?.fullName || "—"}
            </h3>
            {account?.role && (
              <Badge variant="secondary" className="text-2xs font-medium">
                {ROLE_LABEL[account.role] ?? account.role}
              </Badge>
            )}
            {statusCfg && (
              <Badge
                variant={statusCfg.variant}
                className="text-2xs font-medium"
              >
                {statusCfg.label}
              </Badge>
            )}
          </div>
          {/* Account ID intentionally not shown: a truncated GUID identifies the user
              to nobody — the email right below already does that, and support looks
              accounts up by email. */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail size={11} />
              {account?.email}
              {account?.emailConfirmed && (
                <BadgeCheck size={11} className="text-emerald-500" />
              )}
            </span>
            {account?.phoneNumber && (
              <span className="flex items-center gap-1">
                <Phone size={11} />
                {account.phoneNumber}
                {account.phoneConfirmed && (
                  <BadgeCheck size={11} className="text-emerald-500" />
                )}
              </span>
            )}
            {account?.createdAt && (
              <span className="flex items-center gap-1">
                <CalendarDays size={11} />
                Joined {formatDate(account.createdAt)}
              </span>
            )}
            {account?.lastLoginAt && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                Last login {formatDateTime(account.lastLoginAt)}
              </span>
            )}
            {account?.twoFactorEnabled && (
              <span className="flex items-center gap-1 text-emerald-600">
                <ShieldCheck size={11} />
                2FA enabled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Editable info form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <p className="text-2sm font-semibold mb-3">Personal information</p>
          <Separator />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Full name — full width */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">
              Full name <span className="text-destructive">*</span>
            </Label>
            <Input {...register("fullName")} className="h-9" />
            {errors.fullName && (
              <p className="text-xs text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email — readonly */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Email (read-only)
            </Label>
            <Input
              value={account?.email ?? ""}
              disabled
              className="h-9 bg-muted/50 cursor-not-allowed"
            />
          </div>

          {/* Phone number */}
          <div className="space-y-1.5">
            <Label className="text-xs">Phone number</Label>
            <Input
              {...register("phoneNumber")}
              className="h-9"
              placeholder="0912 345 678"
            />
            {errors.phoneNumber && (
              <p className="text-xs text-destructive">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Date of birth */}
          <div className="space-y-1.5">
            <Label className="text-xs">Date of birth</Label>
            <Controller
              control={control}
              name="birthDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={(v) => field.onChange(v ?? "")}
                  className="h-9"
                />
              )}
            />
          </div>

          {/* Time zone — read-only: the system runs on a single time zone, and quiet hours
              are resolved against it on the BE. A free-text box here let a typo through
              ("Asia/Saigon", "GMT+7") that the BE silently falls back on, so the user got
              notifications at hours they never chose. Still registered so the value the BE
              stored travels back unchanged on save. */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Time zone (read-only)
            </Label>
            <Input
              {...register("timeZone")}
              disabled
              className="h-9 bg-muted/50 cursor-not-allowed"
            />
          </div>

          {/* Address — full width */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Input
              {...register("address")}
              className="h-9"
              placeholder="Street address, ward/district, city/province"
            />
          </div>
        </div>

        {/* Staff info — read-only block */}
        {account?.staffProfile && (
          <div className="space-y-3">
            <div>
              <p className="text-2sm font-semibold mb-3 flex items-center gap-1.5">
                <Briefcase size={13} />
                Staff information
              </p>
              <Separator />
            </div>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              {account.staffProfile.employeeCode && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Employee code</p>
                  <p className="font-mono font-medium">
                    {account.staffProfile.employeeCode}
                  </p>
                </div>
              )}
              {account.staffProfile.department && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {account.staffProfile.department}
                  </p>
                </div>
              )}
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Skill tier</p>
                <p className="font-medium">
                  {TIER_LABEL[account.staffProfile.skillTier] ??
                    `Tier ${account.staffProfile.skillTier}`}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  Max concurrent tickets
                </p>
                <p className="font-medium">
                  {account.staffProfile.maxConcurrentTickets}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Status</p>
                <p
                  className={
                    account.staffProfile.isAvailable
                      ? "text-emerald-600 font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {account.staffProfile.isAvailable
                    ? "Available"
                    : "Unavailable"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Supported avatar formats: JPG, PNG, WEBP · Max 20MB
          </p>
          <Button type="submit" size="sm" disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
