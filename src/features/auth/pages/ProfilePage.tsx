import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useFileBlobUrl } from "@/shared/hooks/file/useFileBlobUrl";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/features/auth/schemas/profile.schema";
import { useProfile } from "@/features/auth/hooks/useProfile";
import { useUpdateProfile } from "@/features/auth/hooks/useUpdateProfile";
import { useUpdateAvatar } from "@/features/auth/hooks/useUpdateAvatar";
import { useUploadFile } from "@/shared/hooks/file/useUploadFile";
import { FilePurposeEnum } from "@/shared/types/file-storage.types";
import { handleErrorApi } from "@/shared/lib/errors";
import { AccountStatusEnum } from "@/shared/enums/account.enum";

// ── Maps ─────────────────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  Admin: "Quản trị viên",
  Manager: "Quản lý",
  Staff: "Kỹ thuật viên",
  Customer: "Khách hàng",
};

const STATUS_CONFIG: Record<
  number,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  [AccountStatusEnum.PendingVerification]: {
    label: "Chờ xác thực",
    variant: "outline",
  },
  [AccountStatusEnum.Active]: { label: "Hoạt động", variant: "default" },
  [AccountStatusEnum.Locked]: { label: "Bị khóa", variant: "destructive" },
  [AccountStatusEnum.Inactive]: {
    label: "Không hoạt động",
    variant: "secondary",
  },
  [AccountStatusEnum.Suspended]: {
    label: "Tạm đình chỉ",
    variant: "destructive",
  },
  [AccountStatusEnum.Banned]: { label: "Bị cấm", variant: "destructive" },
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
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: account
      ? {
          fullName: account.fullName ?? "",
          phoneNumber: account.phoneNumber ?? "",
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
      await updateProfile({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || undefined,
        address: data.address || undefined,
        birthDate: data.birthDate || undefined,
        timeZone: data.timeZone || undefined,
      });
      toast.success("Cập nhật hồ sơ thành công");
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
            toast.error("Tải ảnh thất bại");
            return;
          }
          updateAvatar(
            { avatarFileId: res.data.fileId },
            {
              onSuccess: () =>
                toast.success("Cập nhật ảnh đại diện thành công"),
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

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-4 w-32" />
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Profile banner ── */}
      <div className="flex items-center gap-5 p-5 rounded-xl bg-muted/40 border border-border/60">
        {/* Avatar — toàn bộ vùng tròn clickable */}
        <button
          type="button"
          disabled={isAvatarBusy}
          onClick={() => fileInputRef.current?.click()}
          className="relative shrink-0 rounded-full group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Thay đổi ảnh đại diện"
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
          {/* Hover overlay — nét đứt + icon camera giữa */}
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
              <Badge variant="secondary" className="text-[11px] font-medium">
                {ROLE_LABEL[account.role] ?? account.role}
              </Badge>
            )}
            {statusCfg && (
              <Badge
                variant={statusCfg.variant}
                className="text-[11px] font-medium"
              >
                {statusCfg.label}
              </Badge>
            )}
          </div>
          {account?.id && (
            <p className="text-[11px] text-muted-foreground mb-1.5">
              ID tài khoản:{" "}
              <span className="font-mono select-all text-foreground/70">
                {account.id.slice(0, 8).toUpperCase()}…
              </span>
            </p>
          )}
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
                Tham gia {format(new Date(account.createdAt), "dd/MM/yyyy")}
              </span>
            )}
            {account?.lastLoginAt && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                Đăng nhập lần cuối{" "}
                {format(new Date(account.lastLoginAt), "dd/MM/yyyy HH:mm")}
              </span>
            )}
            {account?.twoFactorEnabled && (
              <span className="flex items-center gap-1 text-emerald-600">
                <ShieldCheck size={11} />
                2FA bật
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Editable info form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <p className="text-[13px] font-semibold mb-3">Thông tin cá nhân</p>
          <Separator />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Họ và tên — full width */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">
              Họ và tên <span className="text-destructive">*</span>
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
              Email (chỉ đọc)
            </Label>
            <Input
              value={account?.email ?? ""}
              disabled
              className="h-9 bg-muted/50 cursor-not-allowed"
            />
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <Label className="text-xs">Số điện thoại</Label>
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

          {/* Ngày sinh */}
          <div className="space-y-1.5">
            <Label className="text-xs">Ngày sinh</Label>
            <Input type="date" {...register("birthDate")} className="h-9" />
          </div>

          {/* Múi giờ */}
          <div className="space-y-1.5">
            <Label className="text-xs">Múi giờ</Label>
            <Input
              {...register("timeZone")}
              className="h-9"
              placeholder="Asia/Ho_Chi_Minh"
            />
          </div>

          {/* Địa chỉ — full width */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Địa chỉ</Label>
            <Input
              {...register("address")}
              className="h-9"
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
            />
          </div>
        </div>

        {/* Staff info — read-only block */}
        {account?.staffProfile && (
          <div className="space-y-3">
            <div>
              <p className="text-[13px] font-semibold mb-3 flex items-center gap-1.5">
                <Briefcase size={13} />
                Thông tin nhân viên
              </p>
              <Separator />
            </div>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              {account.staffProfile.employeeCode && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Mã nhân viên</p>
                  <p className="font-mono font-medium">
                    {account.staffProfile.employeeCode}
                  </p>
                </div>
              )}
              {account.staffProfile.department && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Phòng ban</p>
                  <p className="font-medium">
                    {account.staffProfile.department}
                  </p>
                </div>
              )}
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Cấp bậc kỹ năng</p>
                <p className="font-medium">
                  {TIER_LABEL[account.staffProfile.skillTier] ??
                    `Tier ${account.staffProfile.skillTier}`}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  Ticket đồng thời tối đa
                </p>
                <p className="font-medium">
                  {account.staffProfile.maxConcurrentTickets}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Trạng thái</p>
                <p
                  className={
                    account.staffProfile.isAvailable
                      ? "text-emerald-600 font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {account.staffProfile.isAvailable
                    ? "Sẵn sàng"
                    : "Không sẵn sàng"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Hỗ trợ ảnh đại diện: JPG, PNG, WEBP · Tối đa 20MB
          </p>
          <Button type="submit" size="sm" disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
