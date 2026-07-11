// Toast message tĩnh của feature auth — gom về 1 nguồn để soát chính tả + đổi wording 1 chỗ.
// Dùng: toast.success(AUTH_MESSAGES.otp.resent)

export const AUTH_MESSAGES = {
  google: {
    unlinked: "Hủy liên kết Google thành công",
    linked: "Liên kết Google thành công",
    loginFailed: "Đăng nhập Google thất bại",
  },
  password: {
    changed: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
    reset: "Mật khẩu đã được đặt lại thành công!",
  },
  email: {
    otpSent: "Đã gửi OTP đến email mới",
    changed: "Đổi email thành công. Vui lòng đăng nhập lại.",
  },
  phone: {
    otpSent: "Đã gửi OTP đến số điện thoại",
    verified: "Xác thực số điện thoại thành công",
  },
  otp: {
    resent: "OTP đã được gửi lại",
    verified: "Xác thực thành công!",
    sentToEmail: "OTP đã được gửi đến email của bạn",
    expired: "Mã xác thực đã hết hạn, vui lòng thử lại.",
  },
  twoFactor: {
    refreshing: "Đang làm mới trạng thái 2FA...",
    enabled: "Đã bật 2FA. Lưu lại backup codes ngay.",
    enabledSimple: "Đã bật 2FA thành công.",
    disabled: "Đã tắt xác thực 2 lớp",
    backupRegenerated: "Đã sinh backup codes mới. Codes cũ vô hiệu hóa.",
  },
  register: {
    success: "Đăng ký thành công! Vui lòng xác thực OTP.",
  },
  login: {
    failed: "Đăng nhập thất bại",
  },
  account: {
    dataExported: "Đã tải dữ liệu tài khoản (JSON)",
    reactivated: "Khôi phục tài khoản thành công. Vui lòng đăng nhập lại.",
  },
  profile: {
    updated: "Cập nhật hồ sơ thành công",
    avatarUpdated: "Cập nhật ảnh đại diện thành công",
    avatarUploadFailed: "Tải ảnh thất bại",
  },
} as const;
