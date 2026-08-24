import { useEffect, useRef } from "react";
import { animate, createTimeline, onScroll } from "animejs";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Ticket,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createCleanupBag,
  prefersReducedMotion,
  EASE,
} from "@/features/landing/lib/animation";

const TRUST_ITEMS = [
  { icon: ShieldCheck, text: "0 SLA breach" },
  { icon: Zap, text: "Alerts within seconds" },
  { icon: Ticket, text: "Tickets raised automatically from alerts" },
  { icon: CheckCircle2, text: "Complete audit trail" },
] as const;

const FinalCtaSection = ({ onLogin }: { onLogin: () => void }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (prefersReducedMotion()) return;

    const bag = createCleanupBag();

    const targets = [
      "[data-anim='badge']",
      "[data-anim='headline']",
      "[data-anim='subhead']",
      "[data-anim='cta-buttons']",
      "[data-anim='trust-items']",
    ]
      .map((sel) => section.querySelector<HTMLElement>(sel))
      .filter((el): el is HTMLElement => el !== null);

    const tl = createTimeline({
      defaults: { ease: EASE.out },
      autoplay: onScroll({ target: section, repeat: false }),
    });

    targets.forEach((el, i) => {
      tl.add(
        el,
        { opacity: [0, 1], translateY: [16, 0], duration: 550 },
        i === 0 ? 0 : "-=380",
      );
    });

    bag.add(tl);

    if (glowRef.current) {
      bag.add(
        animate(glowRef.current, {
          scale: [1, 1.15],
          opacity: [0.5, 0.85],
          duration: 3200,
          ease: EASE.inOut,
          loop: true,
          alternate: true,
        }),
      );
    }

    return () => bag.flush();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-slate-950 px-5 py-24 lg:px-8 lg:py-32"
    >
      {/* Subtle radial glow top-center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 flex justify-center"
      >
        <div
          ref={glowRef}
          className="h-80 w-175 rounded-full bg-emerald-500/10 blur-[96px]"
        />
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
        <div
          data-anim="badge"
          style={{ opacity: 0 }}
          className="mb-5 flex justify-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="ping-soft absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            System operational
          </span>
        </div>

        {/* Headline */}
        <h2
          data-anim="headline"
          style={{ opacity: 0 }}
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl leading-[1.08]"
        >
          No alert ever
          <br />
          <span className="text-emerald-400">slips through again.</span>
        </h2>

        {/* Subheadline */}
        <p
          data-anim="subhead"
          style={{ opacity: 0 }}
          className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg"
        >
          One console for SOH, anomaly alerts, work orders and SLAs — every step
          from detection to closure leaves a clear audit trail.
        </p>

        {/* CTA Buttons */}
        <div
          data-anim="cta-buttons"
          style={{ opacity: 0 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Button
            size="lg"
            onClick={onLogin}
            className="h-12 gap-2 rounded-xl bg-white px-7 font-bold text-slate-950 shadow-lg hover:bg-slate-100 cursor-pointer"
          >
            Enter the system
            <ArrowRight className="size-4" />
          </Button>
          <a
            href="#product"
            className="flex h-12 items-center gap-2 rounded-xl border border-white/15 px-7 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            See the product
          </a>
        </div>

        {/* Trust items row */}
        <div
          data-anim="trust-items"
          style={{ opacity: 0 }}
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
        </div>

        {/* Divider line */}
        <div className="mt-14 border-t border-white/[0.07]" />

        {/* Already have account */}
        <p className="mt-7 text-sm text-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onLogin}
            className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            Sign in &rarr;
          </button>
        </p>
      </div>
    </section>
  );
};

export default FinalCtaSection;
