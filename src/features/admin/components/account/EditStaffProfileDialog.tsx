import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/shared/utils/datetime";
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
import { DatePicker } from "@/shared/components/ui/DatePicker";
import {
  editStaffProfileSchema,
  addSkillSchema,
  type EditStaffProfileFormValues,
  type AddSkillFormValues,
} from "@/features/admin/schemas/account/staff-profile.schema";
import {
  useAdminUpdateStaffProfile,
  useAdminAddSkill,
  useAdminDeleteSkill,
} from "@/features/admin/hooks/account/useAdminStaff";
import { useAdminAccountDetail } from "@/features/admin/hooks/account/useAdminAccounts";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  AccountDto,
  StaffSkillDto,
} from "@/shared/types/account/account.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

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

  const { data: liveAccount } = useAdminAccountDetail(account.id);
  const current = liveAccount ?? account;

  const sp = current.staffProfile;

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
      skillTier: sp?.skillTier ?? 1,
      notes: sp?.notes ?? "",
    },
  });

  // ── Add skill form ──
  const skillForm = useForm<AddSkillFormValues>({
    resolver: zodResolver(addSkillSchema),
    mode: "onChange",
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
          skillTier: data.skillTier,
          notes: data.notes || undefined,
        },
      });
      toast.success(ADMIN_MESSAGES.staffProfile.updated);
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
      toast.success(ADMIN_MESSAGES.staffProfile.skillAdded);
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
          toast.success(ADMIN_MESSAGES.staffProfile.skillDeleted);
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
            <DialogTitle>Staff profile — {current.fullName}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Details</TabsTrigger>
              <TabsTrigger value="skills">Skills ({skills.length})</TabsTrigger>
            </TabsList>

            {/* ── Profile tab ── */}
            <TabsContent value="profile">
              <form
                onSubmit={profileForm.handleSubmit(handleSaveProfile)}
                className="space-y-3 pt-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Employee code</Label>
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
                    <Label>Department</Label>
                    <Input
                      {...profileForm.register("department")}
                      placeholder="Engineering"
                    />
                    {pErr.department && (
                      <p className="text-xs text-red-500">
                        {pErr.department.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Max concurrent tickets{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
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
                    <Label>Status</Label>
                    <select
                      {...profileForm.register("isAvailable", {
                        setValueAs: (v: unknown) => v === "true" || v === true,
                      })}
                      className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="true">Available</option>
                      <option value="false">Unavailable</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Skill tier <span className="text-destructive">*</span>
                    </Label>
                    <select
                      {...profileForm.register("skillTier", {
                        valueAsNumber: true,
                      })}
                      className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value={1}>Tier 1</option>
                      <option value={2}>Tier 2</option>
                      <option value={3}>Tier 3</option>
                    </select>
                    {pErr.skillTier && (
                      <p className="text-xs text-red-500">
                        {pErr.skillTier.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Notes</Label>
                    <Input
                      placeholder="Internal notes about this staff member"
                      {...profileForm.register("notes")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isSaving && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            {/* ── Skills tab ── */}
            <TabsContent value="skills" className="space-y-4 pt-3">
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No skills yet.
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
                          Level {sk.skillLevel}
                        </span>
                        {sk.certifiedUntil && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            — expires {formatDate(sk.certifiedUntil)}
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
                  Add skill
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>
                      Skill code <span className="text-destructive">*</span>
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
                      Level (1–5) <span className="text-destructive">*</span>
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
                    <Label>Certified until</Label>
                    <Controller
                      control={skillForm.control}
                      name="certifiedUntil"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={(v) => field.onChange(v ?? "")}
                        />
                      )}
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
                    Add
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
            <DialogTitle>Delete skill?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove the skill{" "}
            <strong>{skillToDelete}</strong> from {current.fullName}'s profile?
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setSkillToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => skillToDelete && confirmDeleteSkill(skillToDelete)}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
