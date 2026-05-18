import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, Send } from 'lucide-react';
import solarCtaImg from '@/assets/solar_cta.png';

type PackageId = 'only' | 'battery' | 'monitoring';

const PACKAGE_OPTIONS: Array<{ id: PackageId; label: string }> = [
  { id: 'only', label: 'Solar Only' },
  { id: 'battery', label: 'Solar + Battery' },
  { id: 'monitoring', label: 'Solar + Battery + Monitoring' },
];

const FinalCtaSection = ({ onLogin }: { onLogin: () => void }) => {
  const [selectedPackage, setSelectedPackage] = useState<PackageId>('battery');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Vui lòng nhập địa chỉ email của bạn!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Yêu cầu cấu hình hệ thống của bạn đã được gửi thành công!', {
        description: `Hệ thống sẽ gửi báo giá chi tiết gói ${selectedPackage === 'only' ? 'Solar Only' : selectedPackage === 'battery' ? 'Solar + Battery' : 'Solar + Battery + Monitoring'
          } tới email ${email} trong vòng 24 giờ.`,
      });
      setEmail('');
    }, 1200);
  };

  return (
    <section className="bg-white px-5 py-24 text-slate-900 lg:px-8 lg:py-32 relative overflow-hidden">
      {/* Decorative background visual elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">

          {/* Left: Clean, floating tilted 3D solar panels on white bg, absolutely NO frames or borders */}
          <motion.div
            className="relative aspect-video sm:aspect-[16/10] lg:aspect-[4/3] overflow-hidden flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={solarCtaImg}
              alt="Build your own energy system solar panels tilted"
              className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          </motion.div>

          {/* Right: Build your own energy system text & form */}
          <div className="flex flex-col text-left">
            <motion.p
              className="text-sm font-semibold uppercase tracking-wider text-emerald-700 mb-3"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Cấu hình hệ thống
            </motion.p>
            <motion.h2
              className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-tight mb-4"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Build your own
              <br />
              energy system.
            </motion.h2>
            <motion.p
              className="text-sm sm:text-base text-slate-500 leading-relaxed mb-10 max-w-lg"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Stop renting your power. Get a custom quote based on your home's architecture, energy usage, and budget.
            </motion.p>

            {/* Interactive Package Configurator Form tailored for white background */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">1. Chọn cấu hình phần cứng của bạn:</p>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                  {PACKAGE_OPTIONS.map(opt => {
                    const active = selectedPackage === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedPackage(opt.id)}
                        className={`
                          relative rounded-xl border p-4 text-left transition-all duration-300
                          ${active
                            ? 'bg-slate-50 border-emerald-600 text-emerald-800 shadow-[0_4px_16px_rgba(16,185,129,0.1)]'
                            : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold leading-tight">{opt.label}</span>
                          {active && (
                            <div className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                              <Check className="size-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">2. Nhập thông tin để nhận tư vấn và báo giá:</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Địa chỉ email của bạn…"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="h-12 bg-slate-950 text-white hover:bg-emerald-600 font-bold rounded-xl transition-all duration-300 shrink-0 gap-2 shadow-sm disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        Gửi yêu cầu
                        <Send className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Divider and link to console login */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <span className="text-xs text-slate-400">Đã đăng ký hệ thống vận hành?</span>
                <button
                  type="button"
                  onClick={onLogin}
                  className="text-xs font-semibold text-emerald-700 hover:text-slate-950 transition-colors"
                >
                  Vào hệ thống quản lý &rarr;
                </button>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FinalCtaSection;
