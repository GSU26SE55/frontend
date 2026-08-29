import Reveal from "@/features/landing/components/Reveal";
import logoImg from "@/assets/logo.webp";

const PRODUCT_LINKS = [
  { label: "Battery monitoring", href: "#product" },
  { label: "Anomaly alerts", href: "#product" },
  { label: "SLA management", href: "#governance" },
  { label: "Technical support", href: "#workflow" },
];

// Every href here resolves to a section that exists on the page. "About us" pointed at
// href="#" and so did "Contact" — a link that goes nowhere reads as a broken page, and the
// system has no Contact route to send it to, so that entry is gone rather than faked.
const COMPANY_LINKS = [
  { label: "About us", href: "#product" },
  { label: "Service workflow", href: "#workflow" },
  { label: "System roles", href: "#roles" },
];

const LandingFooter = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 px-5 pt-16 pb-8 lg:px-8 border-t border-white/[0.06] relative overflow-hidden">
      {/* Subtle top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
      >
        <div className="h-px w-150 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      </div>

      <Reveal className="mx-auto max-w-7xl relative z-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.06] border border-white/[0.1]">
                <img
                  src={logoImg}
                  alt="Solars Logo"
                  className="h-5 w-auto object-contain brightness-0 invert"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <span className="font-bold text-base tracking-tight text-white">
                Solars Battery Management
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              An AI platform for monitoring and maintaining lithium-ion
              batteries in solar energy systems — serving Admin, Manager and
              Staff from a single console.
            </p>
            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="ping-soft absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              All systems operational
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Features
            </h3>
            <ul className="space-y-2.5 text-sm">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        {/* Privacy policy / Terms of service were href="#" — no such pages exist, and
            pointing a legal link somewhere arbitrary is worse than not offering it. */}
        <div className="border-t border-white/[0.06] pt-7 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>
            © 2026 Solars · Solar Battery Maintenance Management System. All
            rights reserved.
          </p>
        </div>
      </Reveal>
    </footer>
  );
};

export default LandingFooter;
