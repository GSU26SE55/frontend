import { motion } from "framer-motion";
import { Clock, Database, ShieldCheck, Zap } from "lucide-react";
import Reveal from "@/features/landing/components/Reveal";

const FEATURE_CARDS = [
  {
    icon: Zap,
    badge: "P1 · P2 · P3",
    title: "SLA Priority Matrix",
    desc: "Priority tính từ Impact × Urgency — cố định trong toàn vòng đời ticket. P1 đóng trong 4h, P2 trong 24h, P3 trong 72h. Không extend deadline, chỉ escalate nhân lực.",
    isDark: true,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15",
  },
  {
    icon: Clock,
    badge: "Auto-escalate",
    title: "Escalation Engine",
    desc: "Khi SLA gần breach, hệ thống tự động escalate lên tier cao hơn, notify Manager và Admin trước khi trễ hạn.",
    isDark: false,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
  },
  {
    icon: Database,
    badge: "Immutable log",
    title: "Audit Trail đầy đủ",
    desc: "Mọi hành động trên ticket — phân công, đổi trạng thái, comment, upload — đều có timestamp, actor và role. Truy vết theo thời gian thực.",
    isDark: false,
    iconColor: "text-slate-600",
    iconBg: "bg-slate-100",
  },
  {
    icon: ShieldCheck,
    badge: "ITIL 4 SVS",
    title: "Tuân thủ ITIL 4",
    desc: "Quy trình ticket theo chuẩn ITIL 4 Service Value System — phù hợp B2B service provider, không phải IT nội bộ.",
    isDark: false,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
] as const;

const FeatureCard = ({
  card,
  index,
}: {
  card: (typeof FEATURE_CARDS)[number];
  index: number;
}) => {
  const Icon = card.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: "easeOut" }}
      className={`
        group relative h-[280px] rounded-[22px] p-7 flex flex-col justify-between
        transition-all duration-300 cursor-default
        ${
          card.isDark
            ? "bg-[#080a0f] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.4)] text-white"
            : "bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300/80 text-slate-900"
        }
      `}
    >
      {/* Icon + badge row */}
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
        >
          <Icon className={`size-5 ${card.iconColor}`} />
        </div>
        <span
          className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider ${
            card.isDark
              ? "bg-white/[0.07] text-slate-300 border border-white/[0.1]"
              : "bg-slate-100 text-slate-500 border border-slate-200"
          }`}
        >
          {card.badge}
        </span>
      </div>

      {/* Title & Description */}
      <div>
        <h3
          className={`text-base font-bold tracking-tight mb-2 ${
            card.isDark ? "text-white" : "text-slate-900"
          }`}
        >
          {card.title}
        </h3>
        <p
          className={`text-sm leading-relaxed ${
            card.isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {card.desc}
        </p>
      </div>
    </motion.div>
  );
};

const GovernanceSection = () => (
  <section id="governance" className="bg-white px-5 py-18 lg:px-8 lg:py-24">
    <div className="mx-auto max-w-7xl">
      <Reveal>
        <div className="max-w-3xl mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Kiểm soát vận hành
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-tight">
            Quy trình bảo trì
            <br />
            đúng chuẩn ITIL 4.
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-2xl">
            SLA, escalation và audit trail được thiết kế để không bao giờ để
            ticket rơi vào khoảng trống — mọi hành động đều có người chịu trách
            nhiệm.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURE_CARDS.map((card, i) => (
          <FeatureCard key={card.title} card={card} index={i} />
        ))}
      </div>

      {/* Supporting quote / callout */}
      <Reveal delay={200}>
        <div className="mt-10 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-7 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <ShieldCheck className="size-5 text-emerald-700" />
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            <span className="font-semibold text-slate-900">
              Priority không thay đổi trong vòng đời ticket.
            </span>{" "}
            SLA breach kéo thêm nhân lực, không extend deadline — giữ audit
            trail chính xác cho báo cáo vận hành.
          </p>
        </div>
      </Reveal>
    </div>
  </section>
);

export default GovernanceSection;
