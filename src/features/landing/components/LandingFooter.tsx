import logoImg from '@/assets/logo.png';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const LandingFooter = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Vui lòng nhập email của bạn!');
      return;
    }
    toast.success('Đăng ký bản tin thành công!', {
      description: 'Cảm ơn bạn đã đăng ký nhận thông tin từ Hệ thống.',
    });
    setEmail('');
  };

  return (
    <footer className="bg-slate-950 text-slate-400 px-5 pt-16 pb-8 lg:px-8 border-t border-white/5 relative overflow-hidden">
      {/* Footer Content Grid */}
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5 mb-12">

          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 p-1 border border-white/10">
                <img
                  src={logoImg}
                  alt="Solar Energy Logo"
                  className="h-full w-auto object-contain brightness-0 invert"
                />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">Hệ thống Quản lý Năng lượng Mặt trời</span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-sm">
              Cung cấp giải pháp năng lượng bền vững, hiệu quả cao và tối ưu hóa chi phí thông qua các tấm pin năng lượng mặt trời hiện đại, hệ thống lưu trữ điện thông minh và giám sát thời gian thực.
            </p>
          </div>

          {/* Links Column 1: Products */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">Sản phẩm</h4>
            <ul className="space-y-2.5 text-xs md:text-sm">
              {['Solar Only', 'Solar + Battery', 'Solar + Battery + Monitoring', 'Hỗ trợ kỹ thuật'].map(link => (
                <li key={link}>
                  <a href="#product" className="hover:text-white transition-colors duration-250">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2: Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">Công ty</h4>
            <ul className="space-y-2.5 text-xs md:text-sm">
              {['Về chúng tôi', 'Tuyển dụng', 'Liên hệ', 'Báo chí'].map(link => (
                <li key={link}>
                  <a href="#workflow" className="hover:text-white transition-colors duration-250">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / Subscribe */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">Bản tin</h4>
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <p className="text-xs text-slate-500 leading-normal">Đăng ký để nhận tin tức cập nhật mới nhất về công nghệ năng lượng sạch.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email của bạn…"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-950 hover:bg-emerald-500 hover:text-white transition-colors duration-250 shrink-0"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Hệ thống Quản lý Năng lượng Mặt trời. All rights reserved. Hệ thống Quản lý Năng lượng Mặt trời.</p>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:text-slate-300">Chính sách bảo mật</a>
            <a href="#terms" className="hover:text-slate-300">Điều khoản dịch vụ</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
