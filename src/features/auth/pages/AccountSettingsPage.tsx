import { useState } from "react";
import {
  ShieldCheck,
  History,
  Trash2,
  ChevronRight,
  User,
  Settings,
  Phone,
  Link2,
  Lock,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ChangePasswordForm from "@/features/auth/components/ChangePasswordForm";
import ChangeEmailForm from "@/features/auth/components/ChangeEmailForm";
import PhoneVerifySection from "@/features/auth/components/PhoneVerifySection";
import TwoFactorSetup from "@/features/auth/components/TwoFactorSetup";
import GoogleLinkSection from "@/features/auth/components/GoogleLinkSection";
import LoginHistoryTable from "@/features/auth/components/LoginHistoryTable";
import DangerZone from "@/features/auth/components/DangerZone";
import ProfilePage from "@/features/auth/pages/ProfilePage";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

// ── Menu ──────────────────────────────────────────────────────────────────────
const MENU = [
  { key: "profile",     label: "Hồ sơ cá nhân",      icon: User,       desc: "Thông tin cá nhân và ảnh đại diện" },
  { key: "credentials", label: "Mật khẩu & Email",    icon: KeyRound,   desc: "Cập nhật mật khẩu và địa chỉ email đăng nhập" },
  { key: "security",    label: "Bảo mật",              icon: ShieldCheck, desc: "Xác thực 2 lớp, số điện thoại và liên kết bên ngoài" },
  { key: "history",     label: "Lịch sử đăng nhập",   icon: History,    desc: "Xem các phiên đăng nhập gần đây" },
  { key: "danger",      label: "Danger Zone",          icon: Trash2,     desc: "Vô hiệu hóa hoặc xóa tài khoản", danger: true },
] as const;

type MenuKey = (typeof MENU)[number]["key"];

// ── Security row ─────────────────────────────────────────────────────────────
function SecurityRow({
  icon: Icon,
  title,
  description,
  statusBadge,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  statusBadge?: React.ReactNode;
  action?: React.ReactNode;   // compact button — goes top-right inline with title
  children?: React.ReactNode; // expanded form — goes below description
}) {
  return (
    <div className="px-5 py-4 flex items-start gap-4">
      <div className="mt-0.5 size-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon size={13} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="text-sm font-medium">{title}</p>
              {statusBadge}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {action && <div className="shrink-0 mt-0.5">{action}</div>}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ ok, labelOk, labelNo }: { ok: boolean; labelOk: string; labelNo: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      {labelOk}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border">
      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
      {labelNo}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const AccountSettingsPage = () => {
  const { data: account } = useCurrentUser();
  const [active, setActive] = useState<MenuKey>("profile");
  const [credSub, setCredSub] = useState<"password" | "email" | null>(null);

  const current = MENU.find((m) => m.key === active)!;

  return (
    <div className="p-6 space-y-5 max-w-[1100px] mx-auto">
      {/* Page header */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          <Settings className="inline size-3 mr-1 -mt-0.5" />
          Cài đặt
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Cài đặt tài khoản</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Quản lý thông tin và bảo mật tài khoản của bạn.
        </p>
      </div>

      {/* Body card — fixed height so content stays inside */}
      <Card className="min-h-[520px] gap-0 overflow-hidden rounded-xl py-0 md:flex-row">
        {/* ── Nav ── */}
        <nav className="w-full shrink-0 border-b border-border bg-muted/30 px-2 py-3 md:w-52 md:border-b-0 md:border-r">
          {MENU.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActive(item.key); setCredSub(null); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors mb-0.5 cursor-pointer",
                  isActive
                    ? "bg-background text-foreground font-semibold shadow-sm border border-border/50"
                    : "text-foreground/60 hover:bg-background/70 hover:text-foreground",
                  "danger" in item && item.danger && !isActive && "hover:bg-destructive/10 hover:text-destructive",
                  "danger" in item && item.danger && isActive && "bg-destructive/10 text-destructive border-destructive/20",
                )}
              >
                <Icon size={14} className="shrink-0" />
                <span className="flex-1 text-[13px] truncate">{item.label}</span>
                {isActive && <ChevronRight size={11} className="shrink-0 opacity-40" />}
              </button>
            );
          })}
        </nav>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {active === "profile" ? (
            <ProfilePage />
          ) : (
            <>
              {/* Panel header */}
              <div className="px-6 pt-5 pb-0">
                <h2 className="text-base font-semibold">{current.label}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{current.desc}</p>
                <Separator className="mt-3" />
              </div>

              {/* Panel body */}
              <div className="px-6 pb-6 pt-5">
                {/* Mật khẩu & Email — chọn action rồi hiện form */}
                {active === "credentials" && (
                  credSub === null ? (
                    <div className="flex flex-col items-center justify-center min-h-[340px] gap-6">
                      <p className="text-sm text-muted-foreground">Chọn thao tác bạn muốn thực hiện</p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setCredSub("password")}
                          className="flex flex-col items-center gap-4 w-44 py-7 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group"
                        >
                          <div className="size-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Lock size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-sm font-medium">Đổi mật khẩu</p>
                            <p className="text-xs text-muted-foreground">Cập nhật mật khẩu hiện tại</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setCredSub("email")}
                          className="flex flex-col items-center gap-4 w-44 py-7 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group"
                        >
                          <div className="size-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <KeyRound size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-sm font-medium">Đổi email</p>
                            <p className="text-xs text-muted-foreground">Thay đổi địa chỉ email</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-sm">
                      <button
                        onClick={() => setCredSub(null)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors cursor-pointer"
                      >
                        <ChevronRight size={12} className="rotate-180" />
                        Quay lại
                      </button>
                      {credSub === "password" ? (
                        <>
                          <p className="text-[13px] font-semibold mb-4">Đổi mật khẩu</p>
                          <ChangePasswordForm bare />
                        </>
                      ) : (
                        <>
                          <p className="text-[13px] font-semibold mb-4">Đổi địa chỉ email</p>
                          <ChangeEmailForm bare />
                        </>
                      )}
                    </div>
                  )
                )}

                {/* Bảo mật */}
                {active === "security" && (
                  <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/60">
                    <SecurityRow
                      icon={Phone}
                      title="Số điện thoại"
                      description="Xác thực số điện thoại để bảo vệ tài khoản"
                      statusBadge={
                        <StatusBadge ok={!!account?.phoneConfirmed} labelOk="Đã xác thực" labelNo="Chưa xác thực" />
                      }
                    >
                      <PhoneVerifySection bare />
                    </SecurityRow>

                    <SecurityRow
                      icon={Lock}
                      title="Xác thực 2 lớp (2FA)"
                      description="Thêm lớp bảo mật bằng ứng dụng xác thực"
                      statusBadge={
                        <StatusBadge ok={!!account?.twoFactorEnabled} labelOk="Đang bật" labelNo="Chưa bật" />
                      }
                      action={<TwoFactorSetup isEnabled={account?.twoFactorEnabled ?? false} bare />}
                    />

                    <SecurityRow
                      icon={Link2}
                      title="Liên kết Google"
                      description="Đăng nhập nhanh bằng tài khoản Google"
                      action={<GoogleLinkSection isLinked={false} bare />}
                    />
                  </div>
                )}

                {/* Lịch sử — fills remaining height, table scrolls, pagination fixed */}
                {active === "history" && <LoginHistoryTable />}

                {/* Danger Zone */}
                {active === "danger" && <DangerZone />}
              </div>
            </>
          )}
        </main>
      </Card>
    </div>
  );
};

export default AccountSettingsPage;
