import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/features/auth/schemas/profile.schema";
import { useProfile } from "@/features/auth/hooks/useProfile";
import { useUpdateProfile } from "@/features/auth/hooks/useUpdateProfile";
import { useUpdateAvatar } from "@/features/auth/hooks/useUpdateAvatar";
import { useUploadFile } from "@/features/file-storage/hooks/useUploadFile";
import { FilePurposeEnum } from "@/features/file-storage/types/file-storage.types";
import { handleErrorApi } from "@/shared/lib/errors";

const ProfilePage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: account, isLoading } = useProfile();
  const { mutateAsync: updateProfile, isPending: isUpdating } =
    useUpdateProfile();
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutate: updateAvatar, isPending: isAvatarUpdating } =
    useUpdateAvatar();

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
          birthDate: account.dateOfBirth ?? "",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isAvatarBusy = isUploading || isAvatarUpdating;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Hồ sơ của tôi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý thông tin cá nhân và ảnh đại diện
        </p>
      </div>

      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ảnh đại diện</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold bg-emerald-100 text-emerald-700 select-none">
              {initials}
            </div>
            <button
              type="button"
              disabled={isAvatarBusy}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
              aria-label="Thay đổi ảnh đại diện"
            >
              {isAvatarBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Camera className="size-3.5 text-muted-foreground" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Nhấn vào biểu tượng camera để thay đổi ảnh đại diện.</p>
            <p className="mt-1">Hỗ trợ JPG, PNG. Tối đa 5MB.</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-xs text-red-500">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={account?.email ?? ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                  id="phoneNumber"
                  {...register("phoneNumber")}
                  placeholder="0912345678"
                />
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="birthDate">Ngày sinh</Label>
                <Input id="birthDate" type="date" {...register("birthDate")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timeZone">Múi giờ</Label>
                <Input
                  id="timeZone"
                  {...register("timeZone")}
                  placeholder="Asia/Ho_Chi_Minh"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input id="address" {...register("address")} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isUpdating && <Loader2 className="mr-2 size-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
