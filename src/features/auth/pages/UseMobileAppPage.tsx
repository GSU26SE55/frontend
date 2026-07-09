import { Link } from "react-router-dom";
import { Smartphone } from "lucide-react";

// Tài khoản CUSTOMER không dùng web — mọi luồng login (thường/2FA/invite/Google)
// điều hướng CUSTOMER về đây thay vì cho vào portal.
const UseMobileAppPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Smartphone className="size-7 text-primary" />
        </div>

        <h1 className="mt-5 text-xl font-bold tracking-tight">
          Vui lòng sử dụng ứng dụng di động
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tài khoản khách hàng chỉ đăng nhập được trên Mobile App để theo dõi
          pin và tạo yêu cầu hỗ trợ. Trang web dành cho Admin, Manager và Staff.
        </p>

        <Link
          to="/login"
          className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default UseMobileAppPage;
