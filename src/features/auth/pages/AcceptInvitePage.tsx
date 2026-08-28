import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInviteSchema } from "@/features/auth/schemas/account/accept-invite.schema";
import { useAcceptInvite } from "@/features/auth/hooks/account/useAcceptInvite";
import { handleErrorApi } from "@/shared/lib/errors";
import type { AcceptInviteFormValues } from "@/features/auth/types/auth.types";

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
  });

  const { mutateAsync, isPending } = useAcceptInvite();

  const onSubmit = async (data: AcceptInviteFormValues) => {
    if (!token) return;
    try {
      await mutateAsync({
        invitationToken: token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  if (!token) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Invalid link
        </h1>
        <p className="text-sm text-muted-foreground">
          The invitation link is invalid or has expired. Please contact an Admin
          to have it resent.
        </p>
        <Link
          to="/login"
          className="inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Activate account
        </h1>
        <p className="text-sm text-muted-foreground">
          Set a password to finish activating your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10 pr-10 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400"
              {...register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Confirm password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10 pr-10 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
        >
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Activate account
        </Button>
      </form>
    </div>
  );
};

export default AcceptInvitePage;
