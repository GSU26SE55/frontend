// Static toast messages for the auth feature — kept in one place so wording and spelling
// are checked and changed in a single spot. Usage: toast.success(AUTH_MESSAGES.otp.resent)

export const AUTH_MESSAGES = {
  google: {
    unlinked: "Google account unlinked",
    linked: "Google account linked",
    loginFailed: "Google sign-in failed",
  },
  password: {
    changed: "Password changed — please sign in again",
    reset: "Password reset",
  },
  email: {
    otpSent: "OTP sent to the new email",
    changed: "Email changed — please sign in again",
  },
  phone: {
    otpSent: "OTP sent to your phone number",
    verified: "Phone number verified",
  },
  otp: {
    resent: "OTP resent",
    verified: "Verified",
    sentToEmail: "OTP sent to your email",
    expired: "Verification code expired — please try again",
  },
  twoFactor: {
    refreshing: "Refreshing 2FA status…",
    enabled: "2FA enabled — save your backup codes now",
    enabledSimple: "2FA enabled",
    disabled: "Two-factor authentication disabled",
    backupRegenerated:
      "New backup codes generated — the old ones are now invalid",
  },
  register: {
    success: "Account registered — please verify the OTP",
  },
  login: {
    failed: "Sign-in failed",
  },
  account: {
    dataExported: "Account data downloaded (JSON)",
    reactivated: "Account restored — please sign in again",
  },
  profile: {
    updated: "Profile updated",
    avatarUpdated: "Avatar updated",
    avatarUploadFailed: "Avatar upload failed",
  },
} as const;
