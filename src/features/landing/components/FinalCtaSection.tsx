import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Ticket,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TRUST_ITEMS = [
  { icon: ShieldCheck, text: "0 SLA breach" },
  { icon: Zap, text: "Alert trong vài giây" },
  { icon: Ticket, text: "Ticket tự động từ cảnh báo" },
  { icon: CheckCircle2, text: "Audit trail đầy đủ" },
] as const;

const FinalCtaSection = ({ onLogin }: { onLogin: () => void }) => (
  <section className="relative overflow-hidden bg-slate-950 px-5 py-24 lg:px-8 lg:py-32">
    {/* Subtle radial glow top-center */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-32 flex justify-center"
    >
      <div className="h-80 w-[700px] rounded-full bg-emerald-500/10 blur-[96px]" />
    </div>

    {/* Dot grid */}
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />

    <div className="relative z-10 mx-auto max-w-4xl text-center">
      {/* Eyebrow badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-5 flex justify-center"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Hệ thống đang hoạt động
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.08, duration: 0.5 }}
        className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl leading-[1.08]"
      >
        Không có cảnh báo nào
        <br />
        <span className="text-emerald-400">bị bỏ sót nữa.</span>
      </motion.h2>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.16, duration: 0.5 }}
        className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg"
      >
        Một console cho SOH, cảnh báo bất thường, work order và SLA — từ phát
        hiện đến đóng ticket đều có audit trail rõ ràng.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.24, duration: 0.5 }}
        className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
      >
        <Button
          size="lg"
          onClick={onLogin}
          className="h-12 gap-2 rounded-xl bg-white px-7 font-bold text-slate-950 shadow-lg hover:bg-slate-100 cursor-pointer"
        >
          Vào hệ thống
          <ArrowRight className="size-4" />
        </Button>
        <a
          href="#product"
          className="flex h-12 items-center gap-2 rounded-xl border border-white/15 px-7 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
        >
          Xem sản phẩm
        </a>
      </motion.div>

      {/* Trust items row */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.36, duration: 0.5 }}
        className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
      >
        {TRUST_ITEMS.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-2 text-sm text-slate-400"
          >
            <Icon className="size-4 text-emerald-400 shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </motion.div>

      {/* Divider line */}
      <div className="mt-14 border-t border-white/[0.07]" />

      {/* Already have account */}
      <p className="mt-7 text-sm text-slate-500">
        Đã có tài khoản?{" "}
        <button
          type="button"
          onClick={onLogin}
          className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          Đăng nhập ngay &rarr;
        </button>
      </p>
    </div>
  </section>
);

export default FinalCtaSection;
