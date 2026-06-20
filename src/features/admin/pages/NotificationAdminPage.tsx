import { BellRing } from "lucide-react";
import { Card } from "@/components/ui/card";
import CreateNotificationForm from "@/features/admin/components/CreateNotificationForm";

export default function NotificationAdminPage() {
  return (
    <div className="p-6 space-y-5 max-w-[1100px] mx-auto">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          <BellRing className="inline size-3 mr-1 -mt-0.5" />
          Thông báo
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Gửi thông báo</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tạo notification thủ công cho một user (backfill / smoke test).
        </p>
      </div>

      <Card className="rounded-xl p-6">
        <CreateNotificationForm />
      </Card>
    </div>
  );
}
