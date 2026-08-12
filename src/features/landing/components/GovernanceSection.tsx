import { useEffect, useRef } from "react";
import { animate, onScroll, stagger } from "animejs";
import { Clock, Database, ShieldCheck, Zap } from "lucide-react";
import Reveal from "@/features/landing/components/Reveal";
import { prefersReducedMotion } from "@/features/landing/lib/animation";

const FEATURE_CARDS = [
  {
    icon: Zap,
    badge: "P1 · P2 · P3",
    title: "SLA Priority Matrix",
    desc: "Priority is derived from Impact × Urgency and stays fixed for the ticket's whole life. P1 closes within 4h, P2 within 24h, P3 within 72h. Deadlines are never extended — only staffing escalates.",
    isDark: true,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15",
  },
  {
    icon: Clock,
    badge: "Auto-escalate",
    title: "Escalation Engine",
    desc: "As an SLA nears breach, the system escalates to a higher tier and notifies Manager and Admin before the deadline passes.",
    isDark: false,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
  },
  {
    icon: Database,
    badge: "Immutable log",
    title: "Complete audit trail",
    desc: "Every ticket action — assignment, status change, comment, upload — records a timestamp, actor and role, traceable in real time.",
    isDark: false,
    iconColor: "text-slate-600",
    iconBg: "bg-slate-100",
  },
  {
    icon: ShieldCheck,
    badge: "ITIL 4 SVS",
    title: "ITIL 4 compliant",
    desc: "Ticket handling follows the ITIL 4 Service Value System — built for B2B service providers, not internal IT.",
    isDark: false,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
] as const;

const FeatureCard = ({ card }: { card: (typeof FEATURE_CARDS)[number] }) => {
  const Icon = card.icon;

  return (
    <div
      data-anim="feature-card"
      style={{ opacity: 0 }}
      className={`
        group relative h-70 rounded-[22px] p-7 flex flex-col justify-between
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
    </div>
  );
};

const GovernanceSection = () => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (prefersReducedMotion()) return;

    const cards = Array.from(
      grid.querySelectorAll<HTMLElement>("[data-anim='feature-card']"),
    );
    if (cards.length === 0) return;

    const anim = animate(cards, {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 550,
      ease: "outQuad",
      delay: stagger(80),
      autoplay: onScroll({ target: grid, repeat: false }),
    });

    return () => {
      anim.revert();
    };
  }, []);

  return (
    <section id="governance" className="bg-white px-5 py-18 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="max-w-3xl mb-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Operational governance
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-tight">
              Maintenance workflows
              <br />
              built to ITIL 4.
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-2xl">
              SLAs, escalation and audit trails are designed so no ticket ever
              falls through the cracks — every action has someone accountable
              for it.
            </p>
          </div>
        </Reveal>

        <div ref={gridRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_CARDS.map((card) => (
            <FeatureCard key={card.title} card={card} />
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
                Priority never changes during a ticket's life.
              </span>{" "}
              An SLA breach brings in more people rather than extending the
              deadline — keeping the audit trail accurate for operations
              reporting.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default GovernanceSection;
