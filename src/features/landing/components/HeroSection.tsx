import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, createTimeline, set, splitText, stagger } from "animejs";
import {
  AlertTriangle,
  BatteryCharging,
  ChevronRight,
  Clock,
  Gauge,
  Search,
  ShieldCheck,
  Ticket,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Reveal from "@/features/landing/components/Reveal";
import {
  BATTERY_ROWS,
  TICKET_ROWS,
} from "@/features/landing/landing.constants";
import type { HeroDemoId } from "@/features/landing/types/landing.types";
import { prefersReducedMotion, EASE } from "@/features/landing/lib/animation";
import { perTarget } from "@/shared/motion/animeCompat";
import heroImage from "@/assets/hero1.webp";

// ─── Config ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: "health" as HeroDemoId, label: "Health", icon: Gauge },
  { id: "alerts" as HeroDemoId, label: "Alerts", icon: AlertTriangle },
  { id: "tickets" as HeroDemoId, label: "Tickets", icon: Ticket },
  { id: "sla" as HeroDemoId, label: "SLA", icon: ShieldCheck },
] as const;

const DEMO_META: Record<
  HeroDemoId,
  { title: string; placeholder: string; icon: typeof Gauge }
> = {
  health: {
    title: "Battery Health",
    placeholder: "Search battery packs…",
    icon: Gauge,
  },
  alerts: {
    title: "Anomaly Alerts",
    placeholder: "Filter by severity…",
    icon: AlertTriangle,
  },
  tickets: {
    title: "Work Orders",
    placeholder: "Search tickets…",
    icon: Ticket,
  },
  sla: {
    title: "SLA Governance",
    placeholder: "Filter by priority…",
    icon: ShieldCheck,
  },
};

const ALERT_ROWS = [
  {
    id: "ALT-0031",
    site: "Block C · BAT-0417",
    severity: "P1" as const,
    msg: "Temperature above threshold at 46°C",
    time: "2m ago",
  },
  {
    id: "ALT-0028",
    site: "Inverter Yard · BAT-0308",
    severity: "P2" as const,
    msg: "SOH down −4.8% over 7 days",
    time: "18m ago",
  },
  {
    id: "ALT-0025",
    site: "Rooftop A · BAT-0142",
    severity: "P3" as const,
    msg: "Slight voltage fluctuation",
    time: "2h ago",
  },
] as const;

const SLA_ROWS = [
  {
    label: "P1 Critical",
    sla: "< 4h",
    active: 3,
    breach: 0,
    color: "text-red-400",
    bg: "bg-red-500/10",
    dot: "bg-red-500",
  },
  {
    label: "P2 High",
    sla: "< 24h",
    active: 8,
    breach: 0,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    dot: "bg-amber-500",
  },
  {
    label: "P3 Standard",
    sla: "< 72h",
    active: 20,
    breach: 0,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    dot: "bg-slate-500",
  },
] as const;

const severityStyle: Record<"P1" | "P2" | "P3", string> = {
  P1: "bg-red-500/15 text-red-400",
  P2: "bg-amber-500/15 text-amber-400",
  P3: "bg-slate-500/15 text-slate-400",
};

const sohColor = (v: number) =>
  v >= 85 ? "bg-emerald-500" : v >= 60 ? "bg-amber-500" : "bg-red-500";

// ─── Left canvas panel ────────────────────────────────────────────────────────

const CanvasPanel = ({ activeTab }: { activeTab: HeroDemoId }) => {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const bars = barRefs.current.filter(
      (el): el is HTMLDivElement => el !== null,
    );
    if (bars.length === 0) return;

    if (prefersReducedMotion()) {
      bars.forEach((el, i) => {
        el.style.width = `${BATTERY_ROWS[i].soh}%`;
      });
      return;
    }

    const anim = animate(bars, {
      width: perTarget((_el, i) => `${BATTERY_ROWS[i].soh}%`),
      duration: 900,
      ease: EASE.out,
      delay: stagger(100, { start: 400 }),
    });

    return () => {
      anim.revert();
    };
  }, []);

  return (
    <div className="relative hidden overflow-hidden border-r border-white/[0.06] lg:block">
      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* Drag controls (decorative, Railway-style) */}
      <div className="absolute left-3 top-3 flex flex-col gap-1" aria-hidden>
        {["+", "−"].map((s) => (
          <div
            key={s}
            className="flex h-6 w-6 items-center justify-center rounded border border-white/[0.08] bg-white/[0.04] text-xs text-white/30"
          >
            {s}
          </div>
        ))}
      </div>

      {/* Battery service nodes */}
      <div className="relative z-10 flex flex-col gap-3 p-4 pt-14">
        <p className="mb-1 font-mono text-3xs font-medium uppercase tracking-widest text-white/25">
          Battery Services
        </p>
        {BATTERY_ROWS.map((row, i) => {
          const isHighlighted =
            (activeTab === "alerts" && row.status === "Critical") ||
            (activeTab === "health" && i === 0) ||
            (activeTab === "tickets" && i < 2) ||
            (activeTab === "sla" && row.soh < 80);

          return (
            <div
              key={row.id}
              className={cn(
                "rounded-lg border p-3 transition-colors duration-(--motion-enter) ease-strong",
                isHighlighted
                  ? row.status === "Critical"
                    ? "border-red-500/30 bg-red-500/[0.07]"
                    : "border-emerald-500/25 bg-emerald-500/[0.05]"
                  : "border-white/[0.07] bg-white/[0.03]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <BatteryCharging className="size-3.5 shrink-0 text-white/50" />
                  <span className="truncate font-mono text-xs font-medium text-white/80">
                    {row.id}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={cn(
                        "ping-soft absolute inline-flex h-full w-full rounded-full bg-emerald-400 transition-opacity duration-(--motion-enter) ease-strong",
                        isHighlighted ? "opacity-60" : "opacity-0",
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex h-2 w-2 rounded-full",
                        sohColor(row.soh),
                      )}
                    />
                  </span>
                </div>
              </div>

              <div className="mt-2.5">
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    ref={(el) => {
                      barRefs.current[i] = el;
                    }}
                    className={cn("h-full rounded-full", sohColor(row.soh))}
                    style={{ width: 0 }}
                  />
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-3xs text-white/35">{row.site}</span>
                <span className="font-mono text-3xs text-white/50">
                  SOH {row.soh}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Right panel content ──────────────────────────────────────────────────────

const SearchBar = ({ placeholder }: { placeholder: string }) => (
  <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-2.5">
    <Search className="size-3.5 shrink-0 text-white/25" />
    <span className="text-sm text-white/25">{placeholder}</span>
  </div>
);

const Row = ({
  highlighted,
  children,
}: {
  highlighted?: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "flex items-center gap-3 border-b border-white/[0.05] px-4 py-3 last:border-0 transition-colors",
      highlighted ? "bg-white/[0.05]" : "hover:bg-white/[0.025]",
    )}
  >
    {children}
  </div>
);

const HealthContent = ({ placeholder }: { placeholder: string }) => (
  <div>
    <SearchBar placeholder={placeholder} />
    {BATTERY_ROWS.map((row, i) => (
      <Row key={row.id} highlighted={i === 0}>
        <BatteryCharging className="size-4 shrink-0 text-white/35" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/85">{row.id}</p>
          <p className="mt-0.5 text-xs text-white/35">
            {row.site} · {row.temp}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full", sohColor(row.soh))}
              style={{ width: `${row.soh}%` }}
            />
          </div>
          <span className="w-9 text-right font-mono text-xs text-white/55">
            {row.soh}%
          </span>
        </div>
        <span
          className={cn("h-2 w-2 shrink-0 rounded-full", sohColor(row.soh))}
        />
      </Row>
    ))}
  </div>
);

const AlertsContent = ({ placeholder }: { placeholder: string }) => (
  <div>
    <SearchBar placeholder={placeholder} />
    {ALERT_ROWS.map((row, i) => (
      <Row key={row.id} highlighted={i === 0}>
        <AlertTriangle
          className={cn(
            "mt-0.5 size-4 shrink-0",
            row.severity === "P1"
              ? "text-red-400"
              : row.severity === "P2"
                ? "text-amber-400"
                : "text-slate-400",
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/85">{row.msg}</p>
          <p className="mt-0.5 text-xs text-white/35">{row.site}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-3xs font-medium",
              severityStyle[row.severity],
            )}
          >
            {row.severity}
          </span>
          <span className="text-2xs text-white/25">{row.time}</span>
        </div>
      </Row>
    ))}
  </div>
);

const TicketsContent = ({ placeholder }: { placeholder: string }) => (
  <div>
    <SearchBar placeholder={placeholder} />
    {TICKET_ROWS.map((row, i) => (
      <Row key={row.id} highlighted={i === 0}>
        <Ticket className="mt-0.5 size-4 shrink-0 text-white/35" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/85">{row.title}</p>
          <p className="mt-0.5 text-xs text-white/35">
            {row.id} · {row.owner}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-3xs font-medium",
              severityStyle[row.priority],
            )}
          >
            {row.priority}
          </span>
          <span className="flex items-center gap-1 text-2xs text-white/25">
            <Clock className="size-3" />
            {row.sla}
          </span>
        </div>
      </Row>
    ))}
  </div>
);

const SlaContent = () => (
  <div className="space-y-2 p-4">
    {SLA_ROWS.map((row) => (
      <div
        key={row.label}
        className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              row.bg,
            )}
          >
            <Zap className={cn("size-4", row.color)} />
          </div>
          <div>
            <p className={cn("text-sm font-semibold", row.color)}>
              {row.label}
            </p>
            <p className="text-xs text-white/35">SLA: {row.sla}</p>
          </div>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="font-mono text-lg font-semibold text-white">
              {row.active}
            </p>
            <p className="text-3xs text-white/35">Open</p>
          </div>
          <div>
            <p className="font-mono text-lg font-semibold text-emerald-400">
              {row.breach}
            </p>
            <p className="text-3xs text-white/35">Breach</p>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Crossfade helper ─────────────────────────────────────────────────────────

const useCrossfade = <T extends HTMLElement>(dep: unknown) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;

    const anim = animate(node, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 260,
      ease: EASE.out,
    });

    return () => {
      anim.revert();
    };
  }, [dep]);

  return ref;
};

// ─── Main component ───────────────────────────────────────────────────────────

const HeroSection = ({ onLogin }: { onLogin: () => void }) => {
  const [activeDemoId, setActiveDemoId] = useState<HeroDemoId>("health");
  const meta = DEMO_META[activeDemoId];
  const ActiveIcon = meta.icon;

  const crumbRef = useCrossfade<HTMLSpanElement>(activeDemoId);
  const headerLabelRef = useCrossfade<HTMLDivElement>(activeDemoId);
  const contentRef = useCrossfade<HTMLDivElement>(activeDemoId);

  // Hero entrance: split heading into words, timeline heading → subhead → CTA
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    const heading = headingRef.current;
    const sub = subRef.current;
    const cta = ctaRef.current;
    if (!heading || !sub || !cta) return;

    if (prefersReducedMotion()) return;

    const splitter = splitText(heading, { words: true });
    const tl = createTimeline({ defaults: { ease: EASE.out } });

    tl.add(splitter.words, {
      opacity: [0, 1],
      translateY: [28, 0],
      duration: 800,
      delay: stagger(35),
    })
      .add(
        sub,
        { opacity: [0, 1], translateY: [16, 0], duration: 600 },
        "-=500",
      )
      .add(
        cta,
        { opacity: [0, 1], translateY: [16, 0], duration: 600 },
        "-=480",
      );

    if (heroImgRef.current) {
      animate(heroImgRef.current, {
        scale: [1.12, 1],
        duration: 1800,
        ease: EASE.out,
      });
    }

    return () => {
      tl.revert();
      splitter.revert();
    };
  }, []);

  // Sliding tab indicator
  const tabBarRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Record<HeroDemoId, HTMLButtonElement | null>>({
    health: null,
    alerts: null,
    tickets: null,
    sla: null,
  });
  const indicatorReady = useRef(false);

  useLayoutEffect(() => {
    const bar = tabBarRef.current;
    const indicator = indicatorRef.current;
    const activeBtn = tabButtonRefs.current[activeDemoId];
    if (!bar || !indicator || !activeBtn) return;

    const barRect = bar.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const x = btnRect.left - barRect.left;
    const y = btnRect.top - barRect.top;
    const { width, height } = btnRect;

    if (!indicatorReady.current || prefersReducedMotion()) {
      set(indicator, { translateX: x, translateY: y, width, height });
      indicatorReady.current = true;
      return;
    }

    const anim = animate(indicator, {
      translateX: x,
      translateY: y,
      width,
      height,
      duration: 420,
      ease: EASE.out,
    });

    return () => {
      anim.revert();
    };
  }, [activeDemoId]);

  const renderContent = () => {
    if (activeDemoId === "health")
      return <HealthContent placeholder={meta.placeholder} />;
    if (activeDemoId === "alerts")
      return <AlertsContent placeholder={meta.placeholder} />;
    if (activeDemoId === "tickets")
      return <TicketsContent placeholder={meta.placeholder} />;
    return <SlaContent />;
  };

  return (
    <section>
      {/* Hero image */}
      <div className="w-full overflow-hidden bg-slate-950">
        <div className="relative min-h-svh overflow-hidden">
          <img
            ref={heroImgRef}
            src={heroImage}
            alt="Solar battery operations overview"
            className="absolute inset-0 h-full w-full object-cover object-bottom"
            loading="eager"
            // This is the LCP element and it competes with the JavaScript bundle for
            // bandwidth on a cold load; the hint tells the browser to fetch it first.
            fetchPriority="high"
            decoding="async"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.1 0.025 245 / 0.72) 0%, oklch(0.1 0.025 245 / 0.52) 42%, oklch(0.1 0.025 245 / 0.12) 75%, oklch(0.08 0.02 245 / 0.95) 100%)",
            }}
          />

          <div className="relative z-10 flex min-h-svh items-center px-5 pt-20 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <div className="max-w-3xl text-white">
                <h1
                  ref={headingRef}
                  className="text-4xl font-semibold leading-[1.04] sm:text-5xl xl:text-6xl xl:leading-[1.02]"
                >
                  Monitor solar batteries. Resolve incidents faster.
                </h1>
                <p
                  ref={subRef}
                  className="mt-5 max-w-2xl text-base leading-7 text-white/78 sm:text-lg"
                >
                  One console for SOH, alerts, tickets and maintenance SLAs.
                </p>
                <div ref={ctaRef} className="mt-8">
                  <Button
                    size="lg"
                    className="h-12 gap-2 bg-white px-5 font-semibold text-slate-950 hover:bg-slate-100"
                    onClick={onLogin}
                  >
                    Enter the system
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo panel — dark background flowing on from the hero, fading to white at the bottom */}
      <div className="relative bg-[oklch(0.08_0.02_245)]">
        {/* Fade to white at bottom */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white"
        />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-6 lg:px-8 lg:pb-20 lg:pt-8">
          <Reveal delay={140}>
            <div className="relative pb-6">
              <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[oklch(0.1_0.015_245)] shadow-[0_32px_100px_rgba(0,0,0,0.55)]">
                {/* Top nav — Railway breadcrumb style */}
                <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <BatteryCharging className="size-4 text-white/40" />
                    <span className="text-white/30">/</span>
                    <span className="font-medium text-white/65">
                      solar-battery-system
                    </span>
                    <span className="text-white/20">›</span>
                    <span ref={crumbRef} className="font-medium text-white/85">
                      {meta.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/35">
                    <span className="relative flex h-2 w-2">
                      <span className="ping-soft absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </div>
                </div>

                {/* Body: left canvas + right detail */}
                <div className="grid lg:grid-cols-[220px_1fr]">
                  <CanvasPanel activeTab={activeDemoId} />

                  {/* Right detail panel */}
                  <div className="flex flex-col">
                    {/* Right panel header — icon + title + inline status */}
                    <div className="flex items-center gap-2.5 border-b border-white/[0.06] bg-white/[0.01] px-4 py-3">
                      <div
                        ref={headerLabelRef}
                        className="flex items-center gap-2"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.06]">
                          <ActiveIcon className="size-3.5 text-white/60" />
                        </div>
                        <span className="text-sm font-medium text-white/80">
                          {meta.title}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-h-67 flex-1">
                      <div ref={contentRef}>{renderContent()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating tab bar — centered, overlapping the bottom of the panel */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                <div
                  ref={tabBarRef}
                  className="relative flex items-center gap-0.5 rounded-xl border border-white/[0.1] bg-[oklch(0.12_0.015_245)] px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                >
                  <div
                    ref={indicatorRef}
                    aria-hidden
                    className="absolute left-0 top-0 rounded-lg bg-white/[0.1]"
                    style={{ width: 0, height: 0 }}
                  />
                  {TABS.map((tab) => {
                    const active = tab.id === activeDemoId;
                    return (
                      <button
                        key={tab.id}
                        ref={(el) => {
                          tabButtonRefs.current[tab.id] = el;
                        }}
                        type="button"
                        className={cn(
                          "relative z-10 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-(--motion-state) ease-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20",
                          active
                            ? "text-white"
                            : "text-white/35 hover:text-white/65",
                        )}
                        onClick={() => setActiveDemoId(tab.id)}
                      >
                        <tab.icon className="size-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
