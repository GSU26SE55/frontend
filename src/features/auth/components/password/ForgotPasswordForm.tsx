import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { handleErrorApi } from "@/shared/lib/errors";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordStep1Schema,
  type ForgotPasswordStep1Values,
} from "@/features/auth/schemas/password/forgot-password.schema";
import { useForgotPassword } from "@/features/auth/hooks/password/useForgotPassword";

interface ForgotPasswordFormProps {
  onSuccess: (email: string) => void;
}

const ForgotPasswordForm = ({ onSuccess }: ForgotPasswordFormProps) => {
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordStep1Values>({
    resolver: zodResolver(forgotPasswordStep1Schema),
  });

  const { mutateAsync: mutate, isPending } = useForgotPassword(() =>
    onSuccess(getValues("email")),
  );

  const onSubmit = async (data: ForgotPasswordStep1Values) => {
    try {
      await mutate(data);
    } catch (error) {
      // EntityError (400 + listErrors) → the message appears under the input the BE
      // rejected — a wrong or expired code belongs beside the OTP box, not in a toast.
      handleErrorApi({ error, setError });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          className="h-10 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="h-10 w-full rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Send OTP"
        )}
      </Button>
    </form>
  );
};

export default ForgotPasswordForm;
