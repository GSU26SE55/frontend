import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  editStaffProfileSchema,
  addSkillSchema,
  type EditStaffProfileFormValues,
  type AddSkillFormValues,
} from "@/features/admin/schemas/staff-profile.schema";
import {
  useAdminUpdateStaffProfile,
  useAdminAddSkill,
  useAdminDeleteSkill,
} from "@/features/admin/hooks/useAdminStaff";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AccountDto, StaffSkillDto } from "@/shared/types/account.types";

interface Props {
  open: boolean;
  onClose: () => void;
  account: AccountDto;
}

export default function EditStaffProfileDialog({
  open,
  onClose,
  account,
}: Props) {
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);

  const sp = account.staffProfile;

  const { mutateAsync: updateProfile, isPending: isSaving } =
    useAdminUpdateStaffProfile();
  const { mutateAsync: addSkill, isPending: isAdding } = useAdminAddSkill();
  const { mutate: deleteSkill, isPending: isDeleting } = useAdminDeleteSkill();

  // ── Profile form ──
  const profileForm = useForm<EditStaffProfileFormValues>({
    resolver: zodResolver(editStaffProfileSchema),
    values: {
      employeeCode: sp?.employeeCode ?? "",
      department: sp?.department ?? "",
      maxConcurrentTickets: sp?.maxConcurrentTickets ?? 3,
      isAvailable: sp?.isAvailable ?? true,
      notes: sp?.notes ?? "",
    },
  });

  // ── Add skill form ──
  const skillForm = useForm<AddSkillFormValues>({
    resolver: zodResolver(addSkillSchema),
  });

  const handleSaveProfile = async (data: EditStaffProfileFormValues) => {
    try {
      await updateProfile({
        id: account.id,
        payload: {
          employeeCode: data.employeeCode || undefined,
          department: data.department || undefined,
          maxConcurrentTickets: data.maxConcurrentTickets,
          isAvailable: data.isAvailable,
          notes: data.notes || undefined,
        },
      });
      toast.success("Đã cập nhật hồ sơ Staff");
    } catch (error) {
      handleErrorApi({ error, setError: profileForm.setError });
    }
  };

  const handleAddSkill = async (data: AddSkillFormValues) => {
    try {
      await addSkill({
        id: account.id,
        payload: {
          skillCode: data.skillCode,
          skillLevel: data.skillLevel,
          certifiedUntil: data.certifiedUntil || undefined,
        },
      });
      toast.success("Đã thêm kỹ năng");
      skillForm.reset();
    } catch (error) {
      handleErrorApi({ error, setError: skillForm.setError });
    }
  };

  const confirmDeleteSkill = (code: string) => {
    deleteSkill(
      { id: account.id, skillCode: code },
      {
        onSuccess: () => {
          toast.success("Đã xóa kỹ năng");
          setSkillToDelete(null);
        },
        onError: (err) => {
          handleErrorApi({ error: err });
          setSkillToDelete(null);
        },
      },
    );
  };

  const skills: StaffSkillDto[] = sp?.skills ?? [];
  const pErr = profileForm.formState.errors;
  const sErr = skillForm.formState.errors;

  return (
    <>
      <Dialog
        open={open && !skillToDelete}
        onOpenChange={(v: boolean) => !v && onClose()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Hồ sơ Staff — {account.fullName}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Thông tin</TabsTrigger>
              <TabsTrigger value="skills">
                Kỹ năng ({skills.length})
              </TabsTrigger>
            </TabsList>

            {/* ── Profile tab ── */}
            <TabsContent value="profile">
              <form
                onSubmit={profileForm.handleSubmit(handleSaveProfile)}
                className="space-y-3 pt-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Mã nhân viên</Label>
                    <Input
                      {...profileForm.register("employeeCode")}
                      placeholder="EMP-001"
                    />
                    {pErr.employeeCode && (
                      <p className="text-xs text-red-500">
                        {pErr.employeeCode.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phòng ban</Label>
                    <Input
                      {...profileForm.register("department")}
                      placeholder="Kỹ thuật"
                    />
                    {pErr.department && (
                      <p className="text-xs text-red-500">
                        {pErr.department.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Số ticket tối đa <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      placeholder="3"
                      {...profileForm.register("maxConcurrentTickets", {
                        valueAsNumber: true,
                      })}
                    />
                    {pErr.maxConcurrentTickets && (
                      <p className="text-xs text-red-500">
                        {pErr.maxConcurrentTickets.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Trạng thái</Label>
                    <select
                      {...profileForm.register("isAvailable", {
                        setValueAs: (v: unknown) => v === "true" || v === true,
                      })}
                      className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="true">Sẵn sàng</option>
                      <option value="false">Không sẵn sàng</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Ghi chú</Label>
                    <Input
                      placeholder="Ghi chú nội bộ về nhân sự"
                      {...profileForm.register("notes")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Đóng
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isSaving && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Lưu
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            {/* ── Skills tab ── */}
            <TabsContent value="skills" className="space-y-4 pt-3">
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có kỹ năng nào.
                </p>
              ) : (
                <div className="space-y-2">
                  {skills.map((sk: StaffSkillDto) => (
                    <div
                      key={sk.skillCode}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <div>
                        <span className="font-medium">{sk.skillCode}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          Cấp {sk.skillLevel}
                        </span>
                        {sk.certifiedUntil && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            — hết hạn{" "}
                            {new Date(sk.certifiedUntil).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSkillToDelete(sk.skillCode)}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={skillForm.handleSubmit(handleAddSkill)}
                className="space-y-3 border-t border-border pt-3"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Thêm kỹ năng
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>
                      Mã kỹ năng <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...skillForm.register("skillCode")}
                      placeholder="BATTERY_REPAIR"
                    />
                    {sErr.skillCode && (
                      <p className="text-xs text-red-500">
                        {sErr.skillCode.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Cấp độ (1–5) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      placeholder="3"
                      {...skillForm.register("skillLevel", {
                        valueAsNumber: true,
                      })}
                    />
                    {sErr.skillLevel && (
                      <p className="text-xs text-red-500">
                        {sErr.skillLevel.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Hết hạn chứng chỉ</Label>
                    <Input
                      type="date"
                      {...skillForm.register("certifiedUntil")}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isAdding}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isAdding ? (
                      <Loader2 className="mr-1.5 size-3 animate-spin" />
                    ) : (
                      <Plus className="mr-1.5 size-3" />
                    )}
                    Thêm
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Confirm delete skill */}
      <Dialog
        open={!!skillToDelete}
        onOpenChange={(v: boolean) => !v && setSkillToDelete(null)}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Xóa kỹ năng?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa kỹ năng <strong>{skillToDelete}</strong> khỏi
            hồ sơ của {account.fullName}?
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setSkillToDelete(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => skillToDelete && confirmDeleteSkill(skillToDelete)}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
