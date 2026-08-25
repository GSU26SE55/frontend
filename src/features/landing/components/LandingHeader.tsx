import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { LockKeyhole } from "lucide-react";
import { prefersReducedMotion, EASE } from "@/features/landing/lib/animation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/features/landing/landing.constants";
import logoImg from "@/assets/logo.webp";

type LandingHeaderProps = {
  scrolled: boolean;
  onLogin: () => void;
};

const LandingHeader = ({ scrolled, onLogin }: LandingHeaderProps) => {
  const headerRef = useRef<HTMLHeadElement>(null);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    if (prefersReducedMotion()) return;

    const targets = node.querySelectorAll("[data-anim='header-item']");
    const anim = animate(targets, {
      opacity: [0, 1],
      translateY: [-14, 0],
      duration: 600,
      delay: stagger(80, { start: 150 }),
      ease: EASE.out,
    });

    return () => {
      anim.revert();
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed left-0 right-0 top-0 z-40 transition-[color,background-color,border-color,box-shadow] duration-(--motion-enter) ease-strong",
        scrolled
          ? "border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md py-3 px-6 lg:px-12"
          : "border-b border-transparent bg-transparent py-4 px-6 lg:px-12",
      )}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-3 items-center">
        {/* Left: Nav */}
        <nav
          className="flex items-center justify-start gap-6 text-sm font-medium"
          aria-label="Primary navigation"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-anim="header-item"
              className={cn(
                "whitespace-nowrap transition-colors duration-(--motion-enter) ease-strong hidden md:block",
                scrolled
                  ? "text-slate-600 hover:text-slate-950"
                  : "text-white/80 hover:text-white",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Center: Logo */}
        <div className="flex justify-center">
          <a
            href="#main-content"
            data-anim="header-item"
            className="flex h-11 items-center focus:outline-none"
          >
            <img
              src={logoImg}
              alt="Solars Logo"
              className="h-full w-auto object-contain transition-[height] duration-(--motion-enter) ease-strong"
            />
          </a>
        </div>

        {/* Right: Badge + Login */}
        <div className="flex items-center justify-end gap-3">
          {/* "AI-Powered" badge — shown on large enough screens */}
          {/* <span
            data-anim="header-item"
            className={cn(
              "hidden lg:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-[color,background-color,border-color,box-shadow] duration-(--motion-enter) ease-strong",
              scrolled
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
            )}
          >
            <Zap className="size-3" />
            AI Monitoring
          </span> */}

          <Button
            size="sm"
            onClick={onLogin}
            data-anim="header-item"
            className={cn(
              "h-9 gap-2 rounded-lg px-4 text-sm font-semibold transition-[color,background-color,border-color,box-shadow] duration-(--motion-enter) ease-strong cursor-pointer",
              scrolled
                ? "bg-slate-950 text-white hover:bg-slate-800"
                : "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm",
            )}
          >
            <LockKeyhole className="size-3.5" />
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
