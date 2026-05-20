import ChangePasswordForm from '@/features/auth/components/ChangePasswordForm';
import ChangeEmailForm from '@/features/auth/components/ChangeEmailForm';
import PhoneVerifySection from '@/features/auth/components/PhoneVerifySection';
import TwoFactorSetup from '@/features/auth/components/TwoFactorSetup';
import GoogleLinkSection from '@/features/auth/components/GoogleLinkSection';
import DangerZone from '@/features/auth/components/DangerZone';
import LoginHistoryTable from '@/features/auth/components/LoginHistoryTable';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

const AccountSettingsPage = () => {
  const { data: account } = useCurrentUser();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Cài đặt tài khoản</h1>

      <ChangePasswordForm />
      <ChangeEmailForm />
      <PhoneVerifySection />
      <TwoFactorSetup isEnabled={account?.twoFactorEnabled ?? false} />
      <GoogleLinkSection isLinked={false} />
      <LoginHistoryTable />
      <DangerZone />
    </div>
  );
};

export default AccountSettingsPage;
