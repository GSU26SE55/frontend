import { useEffect, useRef } from "react";
import { animate, onScroll, stagger } from "animejs";
import {
  createCleanupBag,
  prefersReducedMotion,
} from "@/features/landing/lib/animation";
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

const parseStatValue = (raw: string) => {
  const match = raw.match(/^(.*?)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return { prefix: "", target: 0, decimals: 0, suffix: raw };
  const [, prefix, numberText, suffix] = match;
  const decimals = numberText.includes(".")
    ? numberText.split(".")[1].length
    : 0;
  return { prefix, target: parseFloat(numberText), decimals, suffix };
};

const StatItem = ({ stat }: { stat: (typeof STATS_DATA)[number] }) => (
  <div
    data-anim="stat-item"
    className="flex flex-col items-center justify-center px-4 text-center"
    style={{ opacity: 0 }}
  >
    <div className="flex items-end gap-1.5">
      <span
        data-anim="stat-value"
        className={`text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] ${stat.color}`}
      >
        {parseStatValue(stat.value).prefix}0
      </span>
      <span className="mb-1 text-base sm:text-xl font-semibold text-slate-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
        {stat.unit}
      </span>
    </div>
    <p className="mt-2 text-sm sm:text-base font-semibold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">
      {stat.label}
    </p>
    <p className="mt-1 hidden sm:block text-xs text-slate-300/80 max-w-45 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
      {stat.sub}
    </p>
  </div>
);

const StatsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(
      container.querySelectorAll<HTMLElement>("[data-anim='stat-item']"),
    );
    if (items.length === 0) return;

    const setFinalValues = () => {
      items.forEach((el, i) => {
        el.style.opacity = "1";
        const valueEl = el.querySelector<HTMLElement>(
          "[data-anim='stat-value']",
        );
        if (!valueEl) return;
        const { prefix, target, decimals, suffix } = parseStatValue(
          STATS_DATA[i].value,
        );
        valueEl.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      });
    };

    if (prefersReducedMotion()) {
      setFinalValues();
      return;
    }

    const bag = createCleanupBag();

    const anim = animate(items, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 600,
      ease: "outQuad",
      delay: stagger(120),
      autoplay: onScroll({ target: container, repeat: false }),
      onBegin: () => {
        items.forEach((el, i) => {
          const valueEl = el.querySelector<HTMLElement>(
            "[data-anim='stat-value']",
          );
          if (!valueEl) return;
          const { prefix, target, decimals, suffix } = parseStatValue(
            STATS_DATA[i].value,
          );
          if (target === 0) {
            valueEl.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
            return;
          }
          const counter = { val: 0 };
          bag.add(
            animate(counter, {
              val: target,
              duration: 1400,
              delay: i * 120,
              ease: "outExpo",
              onUpdate: () => {
                valueEl.textContent = `${prefix}${counter.val.toFixed(decimals)}${suffix}`;
              },
            }),
          );
        });
      },
    });

    return () => {
      anim.revert();
      bag.flush();
    };
  }, []);

  return (
    <section
      className="relative w-full h-105 sm:h-140 lg:h-170 bg-cover bg-center bg-no-repeat overflow-hidden"
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
          {/* Dividers between stat items */}
          <div
            ref={containerRef}
            className="grid grid-cols-3 divide-x divide-white/15"
          >
            {STATS_DATA.map((stat) => (
              <StatItem key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
