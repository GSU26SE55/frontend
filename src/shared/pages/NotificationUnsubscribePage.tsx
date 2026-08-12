import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Loader2, MailCheck, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useNotificationUnsubscribeGet,
  useNotificationUnsubscribePost,
} from "@/shared/hooks/notifications/useNotifications";

export default function NotificationUnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const {
    data: description,
    isLoading: isGetLoading,
    error: getError,
  } = useNotificationUnsubscribeGet(token);

  const unsubscribeMutation = useNotificationUnsubscribePost();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirm = () => {
    if (!token) return;
    unsubscribeMutation.mutate(token, {
      onSuccess: () => {
        setIsSuccess(true);
      },
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full text-center p-6 border-destructive/20 shadow-lg">
          <CardHeader className="flex flex-col items-center gap-2">
            <ShieldAlert className="size-12 text-destructive" />
            <CardTitle className="text-lg">Missing Unsubscribe Token</CardTitle>
            <CardDescription>
              No security unsubscribe token was provided in the link. Please
              check your email and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isGetLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 gap-2">
        <Loader2 className="animate-spin size-6 text-primary" />
        <span className="text-xs text-muted-foreground">
          Verifying unsubscribe token...
        </span>
      </div>
    );
  }

  if (getError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full text-center p-6 border-destructive/20 shadow-lg">
          <CardHeader className="flex flex-col items-center gap-2">
            <ShieldAlert className="size-12 text-destructive" />
            <CardTitle className="text-lg">Invalid or Expired Link</CardTitle>
            <CardDescription>
              This unsubscribe link is invalid or has expired. If you continue
              to receive unwanted emails, please contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      {isSuccess ? (
        <Card className="max-w-md w-full text-center p-6 border-emerald-500/20 shadow-lg bg-emerald-500/5">
          <CardHeader className="flex flex-col items-center gap-2 pb-2">
            <CheckCircle2 className="size-12 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-xl font-bold text-emerald-900 dark:text-emerald-300">
              Unsubscribed Successfully
            </CardTitle>
            <CardDescription className="text-emerald-700/80 dark:text-emerald-400/80">
              You have been successfully unsubscribed from this email category.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-xs text-muted-foreground leading-normal">
              You will no longer receive these emails. You may close this
              window. If this was a mistake, you can re-enable them in your
              profile notification preferences.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-md w-full p-6 shadow-xl border border-border/80">
          <CardHeader className="text-center flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <MailCheck className="size-5 text-primary" />
            </div>
            <CardTitle className="text-xl">Unsubscribe Confirmation</CardTitle>
            <CardDescription>
              Please confirm your request to opt-out of these notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {description && (
              <div className="p-3.5 rounded-lg border border-border bg-muted/40 text-xs text-center text-muted-foreground font-medium">
                {description}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleConfirm}
                disabled={unsubscribeMutation.isPending}
                className="w-full h-10 font-semibold"
              >
                {unsubscribeMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin size-4 mr-2" />
                    Unsubscribing...
                  </>
                ) : (
                  "Confirm Unsubscribe"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
