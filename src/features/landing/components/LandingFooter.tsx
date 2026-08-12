import { Send } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import Reveal from "@/features/landing/components/Reveal";
import logoImg from "@/assets/logo.webp";

const PRODUCT_LINKS = [
  { label: "Battery monitoring", href: "#product" },
  { label: "Anomaly alerts", href: "#product" },
  { label: "SLA management", href: "#governance" },
  { label: "Technical support", href: "#workflow" },
];

const COMPANY_LINKS = [
  { label: "About us", href: "#" },
  { label: "Service workflow", href: "#workflow" },
  { label: "System roles", href: "#roles" },
  { label: "Contact", href: "#" },
];

const LandingFooter = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email address");
      return;
    }
    toast.success("Subscribed to the newsletter", {
      description:
        "Thanks for your interest in the solar battery management system.",
    });
    setEmail("");
  };

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
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5 mb-12">
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
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

          {/* Newsletter */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Newsletter
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              New feature updates and solar battery operations reports.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Your email…"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 rounded-lg bg-white/[0.04] border border-white/[0.1] px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              <button
                type="submit"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors duration-200 cursor-pointer"
                aria-label="Subscribe to the newsletter"
              >
                <Send className="size-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-7 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>
            © 2026 Solars · Solar Battery Maintenance Management System. All
            rights reserved.
          </p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-slate-300 transition-colors">
              Privacy policy
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Terms of service
            </a>
          </div>
        </div>
      </Reveal>
    </footer>
  );
};

export default LandingFooter;
