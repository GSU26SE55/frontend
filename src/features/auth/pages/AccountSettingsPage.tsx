import { useId, useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  MonitorSmartphone,
  Bell,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { DIST, DUR, EASE_OUT, SPRING } from "@/shared/motion/tokens";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ChangePasswordForm from "@/features/auth/components/password/ChangePasswordForm";
import ChangeEmailForm from "@/features/auth/components/profile/ChangeEmailForm";
import PhoneVerifySection from "@/features/auth/components/profile/PhoneVerifySection";
import TwoFactorSetup from "@/features/auth/components/2fa/TwoFactorSetup";
import GoogleLinkSection from "@/features/auth/components/profile/GoogleLinkSection";
import TrustedDevicesSection from "@/features/auth/components/trusted-device/TrustedDevicesSection";
import LoginHistoryTable from "@/features/auth/components/account/LoginHistoryTable";
import DangerZone from "@/features/auth/components/profile/DangerZone";
import NotificationPreferencesSection from "@/features/auth/components/profile/NotificationPreferencesSection";
import NotificationCategoryMatrixSection from "@/features/auth/components/profile/NotificationCategoryMatrixSection";
import ProfilePage from "@/features/auth/pages/ProfilePage";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { UserRole } from "@/shared/types/account/session.types";
import PushTransportSettingsForm from "@/shared/components/notification/PushTransportSettingsForm";

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
  action?: React.ReactNode; // compact button — goes top-right inline with title
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

function StatusBadge({
  ok,
  labelOk,
  labelNo,
}: {
  ok: boolean;
  labelOk: string;
  labelNo: string;
}) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-3xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      {labelOk}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-3xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border">
      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
      {labelNo}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const AccountSettingsPage = () => {
  const { data: account } = useCurrentUser();
  const [active, setActive] = useState<string>("profile");
  const [credSub, setCredSub] = useState<"password" | "email" | null>(null);

  const user = useSessionStore((s) => s.user);
  const isAdmin = user?.role === UserRole.ADMIN;

  const menuItems = useMemo(() => {
    const items: {
      key: string;
      label: string;
      icon: LucideIcon;
      desc: string;
      danger?: boolean;
    }[] = [
      {
        key: "profile",
        label: "Profile",
        icon: User,
        desc: "Personal information and avatar",
      },
      {
        key: "credentials",
        label: "Password & Email",
        icon: KeyRound,
        desc: "Update your password and login email address",
      },
      {
        key: "security",
        label: "Security",
        icon: ShieldCheck,
        desc: "Two-factor authentication, phone number, and external links",
      },
      {
        key: "notifications",
        label: "Notification preferences",
        icon: Bell,
        desc: "Toggle notification channels, quiet hours, and time zone",
      },
    ];

    if (isAdmin) {
      items.push({
        key: "systemNotifications",
        label: "System Push Settings",
        icon: Settings,
        desc: "Configure system-wide push notification strategy",
      });
    }

    items.push(
      {
        key: "history",
        label: "Login history",
        icon: History,
        desc: "View recent login sessions",
      },
      {
        key: "danger",
        label: "Danger Zone",
        icon: Trash2,
        desc: "Deactivate or delete the account",
        danger: true,
      },
    );

    return items;
  }, [isAdmin]);

  const current = menuItems.find((m) => m.key === active)!;
  // Same travelling highlight as the sidebar: one panel that moves to the section you
  // picked. `layoutId` is global, so it is scoped to this page's nav.
  const navId = useId();
  const reduced = useReducedMotion();

  return (
    <PageContainer size="narrow">
      {/* Page header */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          <Settings className="inline size-3 mr-1 -mt-0.5" />
          Settings
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Account settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account information and security.
        </p>
      </div>

      {/* Body card — fixed height so content stays inside */}
      <Card className="min-h-130 gap-0 overflow-hidden rounded-xl py-0 md:flex-row">
        {/* ── Nav ── */}
        <nav className="w-full shrink-0 border-b border-border bg-muted/30 px-2 py-3 md:w-52 md:border-b-0 md:border-r">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActive(item.key);
                  setCredSub(null);
                }}
                className={cn(
                  "relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors mb-0.5 cursor-pointer",
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-foreground/60 hover:bg-background/70 hover:text-foreground",
                  "danger" in item &&
                    item.danger &&
                    !isActive &&
                    "hover:bg-destructive/10 hover:text-destructive",
                  "danger" in item &&
                    item.danger &&
                    isActive &&
                    "text-destructive",
                )}
              >
                {isActive && (
                  <motion.span
                    aria-hidden="true"
                    {...(reduced
                      ? {}
                      : { layoutId: `${navId}-active`, transition: SPRING })}
                    className={cn(
                      "absolute inset-0 rounded-lg border",
                      "danger" in item && item.danger
                        ? "bg-destructive/10 border-destructive/20"
                        : "bg-background border-border/50 shadow-sm",
                    )}
                  />
                )}
                <Icon size={14} className="relative shrink-0" />
                <span className="relative flex-1 text-2sm truncate">
                  {item.label}
                </span>
                {isActive && (
                  <ChevronRight
                    size={11}
                    className="relative shrink-0 opacity-40"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* Keyed on the section, so switching sections replays the entrance instead of
              swapping the panel's contents in place. */}
          <motion.div
            key={active}
            initial={reduced ? false : { opacity: 0, y: DIST.sm }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: DUR.enter, ease: EASE_OUT },
            }}
          >
            {active === "profile" ? (
              <ProfilePage />
            ) : (
              <>
                {/* Panel header */}
                <div className="px-6 pt-5 pb-0">
                  <h2 className="text-base font-semibold">{current.label}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {current.desc}
                  </p>
                  <Separator className="mt-3" />
                </div>

                {/* Panel body */}
                <div className="px-6 pb-6 pt-5">
                  {/* Password & Email — choose an action then show the form */}
                  {active === "credentials" &&
                    (credSub === null ? (
                      <div className="flex flex-col items-center justify-center min-h-85 gap-6">
                        <p className="text-sm text-muted-foreground">
                          Choose the action you want to perform
                        </p>
                        <div className="flex gap-4">
                          <button
                            onClick={() => setCredSub("password")}
                            className="flex flex-col items-center gap-4 w-44 py-7 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-[color,background-color,border-color,box-shadow] duration-(--motion-state) ease-strong cursor-pointer group"
                          >
                            <div className="size-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <Lock
                                size={20}
                                className="text-muted-foreground group-hover:text-primary transition-colors"
                              />
                            </div>
                            <div className="text-center space-y-1">
                              <p className="text-sm font-medium">
                                Change password
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Update your current password
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() => setCredSub("email")}
                            className="flex flex-col items-center gap-4 w-44 py-7 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-[color,background-color,border-color,box-shadow] duration-(--motion-state) ease-strong cursor-pointer group"
                          >
                            <div className="size-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <KeyRound
                                size={20}
                                className="text-muted-foreground group-hover:text-primary transition-colors"
                              />
                            </div>
                            <div className="text-center space-y-1">
                              <p className="text-sm font-medium">
                                Change email
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Change your email address
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center min-h-85">
                        <div className="w-full max-w-md">
                          <button
                            onClick={() => setCredSub(null)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors cursor-pointer"
                          >
                            <ChevronRight size={12} className="rotate-180" />
                            Back
                          </button>
                          {credSub === "password" ? (
                            <>
                              <p className="text-2sm font-semibold mb-4">
                                Change password
                              </p>
                              <ChangePasswordForm bare />
                            </>
                          ) : (
                            <>
                              <p className="text-2sm font-semibold mb-4">
                                Change email address
                              </p>
                              <ChangeEmailForm bare />
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                  {/* Security */}
                  {active === "security" && (
                    <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/60">
                      <SecurityRow
                        icon={Phone}
                        title="Phone number"
                        description="Verify your phone number to protect your account"
                        statusBadge={
                          <StatusBadge
                            ok={!!account?.phoneConfirmed}
                            labelOk="Verified"
                            labelNo="Not verified"
                          />
                        }
                      >
                        <PhoneVerifySection bare />
                      </SecurityRow>

                      <SecurityRow
                        icon={Lock}
                        title="Two-factor authentication (2FA)"
                        description="Add a security layer using an authenticator app"
                        statusBadge={
                          <StatusBadge
                            ok={!!account?.twoFactorEnabled}
                            labelOk="Enabled"
                            labelNo="Disabled"
                          />
                        }
                        action={
                          <TwoFactorSetup
                            isEnabled={account?.twoFactorEnabled ?? false}
                            bare
                          />
                        }
                      />

                      <SecurityRow
                        icon={Link2}
                        title="Google link"
                        description="Sign in quickly using your Google account"
                        action={
                          <GoogleLinkSection
                            isLinked={!!account?.isGoogleLinked}
                            bare
                          />
                        }
                      />

                      <SecurityRow
                        icon={MonitorSmartphone}
                        title="Trusted devices"
                        description="Devices exempt from 2FA verification for 30 days"
                      >
                        <TrustedDevicesSection />
                      </SecurityRow>
                    </div>
                  )}

                  {active === "notifications" && (
                    <div className="space-y-8">
                      <NotificationPreferencesSection />
                      <NotificationCategoryMatrixSection />
                    </div>
                  )}

                  {active === "systemNotifications" && (
                    <div className="space-y-8">
                      <PushTransportSettingsForm />
                    </div>
                  )}

                  {/* History — fills remaining height, table scrolls, pagination fixed */}
                  {active === "history" && <LoginHistoryTable />}

                  {/* Danger Zone */}
                  {active === "danger" && <DangerZone />}
                </div>
              </>
            )}
          </motion.div>
        </main>
      </Card>
    </PageContainer>
  );
};

export default AccountSettingsPage;
