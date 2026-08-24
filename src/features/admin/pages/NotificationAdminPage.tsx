import { Card } from "@/components/ui/card";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import BroadcastNotificationForm from "@/features/admin/components/notification/BroadcastNotificationForm";

export default function NotificationAdminPage() {
  return (
    <PageContainer size="narrow">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          Admin &middot; Notifications
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Send notification
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send a notification to groups and individuals.
        </p>
      </div>

      <Card className="rounded-xl p-6">
        <BroadcastNotificationForm />
      </Card>
    </PageContainer>
  );
}
