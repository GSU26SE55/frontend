import { BellRing } from "lucide-react";
import { Card } from "@/components/ui/card";
import BroadcastNotificationForm from "@/features/admin/components/notification/BroadcastNotificationForm";

export default function NotificationAdminPage() {
  return (
    <div className="p-6 space-y-5 max-w-275 mx-auto">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          <BellRing className="inline size-3 mr-1 -mt-0.5" />
          Thông báo
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Gửi thông báo</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gửi cho nhiều nhóm và cá nhân trong một lần. Người vừa ở trong nhóm
          vừa được chọn đích danh chỉ nhận <b>một</b> lần.
        </p>
      </div>

      <Card className="rounded-xl p-6">
        <BroadcastNotificationForm />
      </Card>
    </div>
  );
}
