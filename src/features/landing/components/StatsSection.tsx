import { motion } from "framer-motion";
import Reveal from "@/features/landing/components/Reveal";
import test1Img from "@/assets/test 1.jpg";

const STATS_DATA = [
  {
    value: "0",
    unit: "breach",
    label: "SLA Breach",
    sub: "Zero vi phạm SLA kể từ khi triển khai",
    color: "text-emerald-400",
  },
  {
    value: "94.7",
    unit: "%",
    label: "SOH Trung bình",
    sub: "Sức khỏe pin trên toàn hệ thống giám sát",
    color: "text-white",
  },
  {
    value: "< 18",
    unit: "phút",
    label: "Thời gian Triage",
    sub: "Từ cảnh báo đến ticket có owner",
    color: "text-white",
  },
] as const;

const StatItem = ({
  stat,
  index,
}: {
  stat: (typeof STATS_DATA)[number];
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.12, duration: 0.5, ease: "easeOut" }}
    className="flex flex-col items-center justify-center px-4 text-center"
  >
    <div className="flex items-end gap-1.5">
      <span
        className={`text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] ${stat.color}`}
      >
        {stat.value}
      </span>
      <span className="mb-1 text-base sm:text-xl font-semibold text-slate-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
        {stat.unit}
      </span>
    </div>
    <p className="mt-2 text-sm sm:text-base font-semibold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">
      {stat.label}
    </p>
    <p className="mt-1 hidden sm:block text-xs text-slate-300/80 max-w-[180px] leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
      {stat.sub}
    </p>
  </motion.div>
);

const StatsSection = () => (
  <section
    className="relative w-full h-[420px] sm:h-[560px] lg:h-[680px] bg-cover bg-center bg-no-repeat overflow-hidden"
    style={{ backgroundImage: `url("${test1Img}")` }}
  >
    {/* Top gradient: blend from white (WorkflowSection) */}
    <div
      className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white via-white/60 to-transparent z-10 pointer-events-none"
      aria-hidden="true"
    />

    {/* Bottom gradient: blend to slate-950 (RolesSection) */}
    <div
      className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent z-10 pointer-events-none"
      aria-hidden="true"
    />

    {/* Dark overlay for readability */}
    <div
      className="absolute inset-0 bg-slate-950/30 z-0 pointer-events-none"
      aria-hidden="true"
    />

    {/* Stats centered near bottom */}
    <div className="absolute bottom-14 sm:bottom-20 left-0 right-0 z-20 px-5">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          {/* Dividers between stat items */}
          <div className="grid grid-cols-3 divide-x divide-white/15">
            {STATS_DATA.map((stat, i) => (
              <StatItem key={stat.label} stat={stat} index={i} />
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

export default StatsSection;
