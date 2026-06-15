import { useState } from "react";
import {
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Link2,
  History,
  Trash2,
  ChevronRight,
  User,
  Settings,
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

// ── Menu items ────────────────────────────────────────────────────────────────
const MENU = [
  {
    key: "profile",
    label: "Hồ sơ cá nhân",
    icon: User,
    desc: "Thông tin cá nhân và ảnh đại diện",
  },
  {
    key: "password",
    label: "Đổi mật khẩu",
    icon: Lock,
    desc: "Cập nhật mật khẩu hiện tại",
  },
  {
    key: "email",
    label: "Đổi email",
    icon: Mail,
    desc: "Thay đổi địa chỉ email",
  },
  {
    key: "phone",
    label: "Số điện thoại",
    icon: Phone,
    desc: "Xác thực số điện thoại",
  },
  {
    key: "2fa",
    label: "Xác thực 2 lớp",
    icon: ShieldCheck,
    desc: "Bảo mật tài khoản nâng cao",
  },
  {
    key: "google",
    label: "Liên kết Google",
    icon: Link2,
    desc: "Đăng nhập nhanh với Google",
  },
  {
    key: "history",
    label: "Lịch sử đăng nhập",
    icon: History,
    desc: "Xem các phiên đăng nhập gần đây",
  },
  {
    key: "danger",
    label: "Danger Zone",
    icon: Trash2,
    desc: "Xóa tài khoản & dữ liệu",
    danger: true,
  },
] as const;

type MenuKey = (typeof MENU)[number]["key"];

// ── Panel header ──────────────────────────────────────────────────────────────
function PanelHeader({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold tracking-tight">{label}</h2>
      <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      <Separator className="mt-4" />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const AccountSettingsPage = () => {
  const { data: account } = useCurrentUser();
  const [active, setActive] = useState<MenuKey>("profile");

  const current = MENU.find((m) => m.key === active)!;

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      {/* Page header */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          <Settings className="inline size-3 mr-1 -mt-0.5" />
          Cài đặt
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cài đặt tài khoản
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý thông tin và bảo mật tài khoản của bạn.
        </p>
      </div>

      {/* Two-column body */}
      <Card className="min-h-[600px] gap-0 overflow-hidden rounded-md py-0 md:flex-row">
        {/* ── Left nav ── */}
        <nav className="w-full shrink-0 border-b border-border bg-background overflow-y-auto px-2 py-3 md:w-56 md:border-b-0 md:border-r">
          {MENU.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors mb-0.5 cursor-pointer",
                  isActive
                    ? "bg-muted text-foreground font-semibold ring-1 ring-border"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground",
                  "danger" in item &&
                    item.danger &&
                    !isActive &&
                    "hover:bg-destructive/10 hover:text-destructive",
                  "danger" in item &&
                    item.danger &&
                    isActive &&
                    "bg-destructive/10 text-destructive ring-destructive/20",
                )}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1 text-[13px] truncate">
                  {item.label}
                </span>
                {isActive && (
                  <ChevronRight size={12} className="shrink-0 opacity-60" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Right content ── */}
        <main
          className={cn(
            "flex-1 overflow-y-auto min-w-0",
            active !== "profile" && "p-6",
          )}
        >
          {active === "profile" ? (
            <ProfilePage />
          ) : (
            <>
              <PanelHeader label={current.label} desc={current.desc} />
              {/* Forms: constrained width. Tables/lists: full width */}
              {active === "password" && (
                <div className="max-w-md">
                  <ChangePasswordForm />
                </div>
              )}
              {active === "email" && (
                <div className="max-w-md">
                  <ChangeEmailForm />
                </div>
              )}
              {active === "phone" && (
                <div className="max-w-md">
                  <PhoneVerifySection />
                </div>
              )}
              {active === "2fa" && (
                <div className="max-w-md">
                  <TwoFactorSetup
                    isEnabled={account?.twoFactorEnabled ?? false}
                  />
                </div>
              )}
              {active === "google" && (
                <div className="max-w-md">
                  <GoogleLinkSection isLinked={false} />
                </div>
              )}
              {active === "history" && <LoginHistoryTable />}
              {active === "danger" && (
                <div className="max-w-md">
                  <DangerZone />
                </div>
              )}
            </>
          )}
        </main>
      </Card>
    </div>
  );
};

export default AccountSettingsPage;
