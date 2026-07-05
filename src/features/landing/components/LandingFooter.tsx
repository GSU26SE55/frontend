import { Send } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import Reveal from "@/features/landing/components/Reveal";
import logoImg from "@/assets/logo.png";

const PRODUCT_LINKS = [
  { label: "Giám sát pin", href: "#product" },
  { label: "Cảnh báo bất thường", href: "#product" },
  { label: "Quản lý SLA", href: "#governance" },
  { label: "Hỗ trợ kỹ thuật", href: "#workflow" },
];

const COMPANY_LINKS = [
  { label: "Về chúng tôi", href: "#" },
  { label: "Quy trình dịch vụ", href: "#workflow" },
  { label: "Phân quyền hệ thống", href: "#roles" },
  { label: "Liên hệ", href: "#" },
];

const LandingFooter = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email của bạn!");
      return;
    }
    toast.success("Đăng ký bản tin thành công!", {
      description: "Cảm ơn bạn đã quan tâm đến hệ thống quản lý pin mặt trời.",
    });
    setEmail("");
  };

  return (
    <footer className="bg-slate-950 text-slate-400 px-5 pt-16 pb-8 lg:px-8 border-t border-white/[0.06] relative overflow-hidden">
      {/* Subtle top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
      >
        <div className="h-px w-150 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      </div>

      <Reveal className="mx-auto max-w-7xl relative z-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.06] border border-white/[0.1]">
                <img
                  src={logoImg}
                  alt="Sunaria Logo"
                  className="h-5 w-auto object-contain brightness-0 invert"
                />
              </div>
              <span className="font-bold text-base tracking-tight text-white">
                Sunaria
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Nền tảng AI giám sát và bảo trì pin lithium-ion cho hệ thống năng
              lượng mặt trời — phục vụ Admin, Manager và Staff trong cùng một
              console.
            </p>
            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Hệ thống vận hành bình thường
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Tính năng
            </h4>
            <ul className="space-y-2.5 text-sm">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Công ty
            </h4>
            <ul className="space-y-2.5 text-sm">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Bản tin
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Cập nhật tính năng mới và báo cáo vận hành pin mặt trời.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Email của bạn…"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              <button
                type="submit"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors duration-200 cursor-pointer"
                aria-label="Đăng ký bản tin"
              >
                <Send className="size-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-7 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>
            © 2026 Sunaria · Solar Battery Maintenance Management System. All
            rights reserved.
          </p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-slate-300 transition-colors">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Điều khoản dịch vụ
            </a>
          </div>
        </div>
      </Reveal>
    </footer>
  );
};

export default LandingFooter;
