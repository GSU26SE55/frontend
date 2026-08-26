import { useEffect, useRef } from "react";
import { animate, onScroll, stagger } from "animejs";
import { ROLES } from "@/features/landing/landing.constants";
import { perTarget } from "@/shared/motion/animeCompat";
import type { RoleItem } from "@/features/landing/types/landing.types";
import {
  createCleanupBag,
  prefersReducedMotion,
  EASE,
} from "@/features/landing/lib/animation";

const RoleCard = ({ role }: { role: RoleItem; index: number }) => (
  <div
    data-anim="role-card"
    style={{ opacity: 0 }}
    className="group h-full cursor-default rounded-md border border-white/10 bg-white/[0.04] p-6 transition-colors duration-(--motion-enter) ease-strong hover:border-emerald-400/30"
  >
    <div className="mb-8 flex items-center justify-between">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-slate-950 transition-transform duration-(--motion-enter) ease-strong group-hover:scale-110">
        <role.icon className="size-5" />
      </div>

      <span className="rounded-sm border border-white/10 px-2 py-1 font-mono text-xs font-medium text-slate-300 transition-[color,background-color,border-color,box-shadow,transform] duration-(--motion-enter) ease-strong group-hover:-translate-y-0.5 group-hover:border-emerald-400/50">
        {role.role}
      </span>
    </div>

    <h3 className="text-lg font-semibold text-white">{role.title}</h3>
    <p className="mt-3 text-sm leading-6 text-slate-300">{role.desc}</p>
  </div>
);

const RolesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (prefersReducedMotion()) return;

    const bag = createCleanupBag();

    const header = section.querySelector<HTMLElement>("[data-anim='header']");
    if (header) {
      bag.add(
        animate(header, {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 600,
          ease: EASE.out,
          autoplay: onScroll({ target: header, repeat: false }),
        }),
      );
    }

    const cards = Array.from(
      section.querySelectorAll<HTMLElement>("[data-anim='role-card']"),
    );
    if (cards.length > 0) {
      bag.add(
        animate(cards, {
          opacity: [0, 1],
          translateX: perTarget((_el, i) => (i === 0 ? [-40, 0] : [40, 0])),
          duration: 600,
          ease: EASE.out,
          delay: stagger(100),
          autoplay: onScroll({ target: section, repeat: false }),
        }),
      );
    }

    return () => bag.flush();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="roles"
      className="bg-slate-950 px-5 py-18 text-white lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div
          data-anim="header"
          style={{ opacity: 0 }}
          className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"
        >
          <div>
            <p className="mb-3 text-sm font-medium text-emerald-300">
              Role-based operations
            </p>
            <h2 className="text-3xl font-semibold leading-tight lg:text-4xl">
              One system, a different set of decisions for every role.
            </h2>
          </div>
          <p className="text-base leading-7 text-slate-300">
            Admins set the operating standard, managers coordinate the queue,
            and staff handle the work in the field.
          </p>
        </div>

        {/* Bento grid: the Admin card is wider */}
        <div className="mt-12 grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          {ROLES.map((role, index) => (
            <RoleCard key={role.role} role={role} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RolesSection;
