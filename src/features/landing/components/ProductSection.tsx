import { useLayoutEffect, useRef } from "react";
import { animate, createTimeline, onScroll } from "animejs";
import { ArrowRight } from "lucide-react";
import {
  createCleanupBag,
  prefersReducedMotion,
} from "@/features/landing/lib/animation";
import solarOnlyImg from "@/assets/solar_only.png";
import solarBatteryImg from "@/assets/solar_battery.png";
import solarMonitoringImg from "@/assets/solar_monitoring.png";

const PRODUCT_ITEMS = [
  {
    image: solarOnlyImg,
    title: "Solar Only",
    desc: "Best for lowering monthly bills and offsetting daytime usage.",
    metric: "Offset up to 70% of electricity bills.",
    idealFor: "Smaller homes or stable grid areas.",
  },
  {
    image: solarBatteryImg,
    title: "Solar + Battery",
    desc: "Medium power for bill savings plus emergency backup power.",
    metric: "Offset up to 95% of bills + 24/7 backup.",
    idealFor: "Families and remote workers.",
  },
  {
    image: solarMonitoringImg,
    title: "Solar + Battery + Monitoring",
    desc: "Maximum power, storage, and granular consumption tracking.",
    metric: "Near 100% grid independence.",
    idealFor: "Large homes and EV owners.",
  },
] as const;

const ProductSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (prefersReducedMotion()) return;

    const bag = createCleanupBag();

    const header = section.querySelector<HTMLElement>("[data-anim='header']");
    const ctaLink = section.querySelector<HTMLElement>(
      "[data-anim='cta-link']",
    );

    if (header) {
      bag.add(
        animate(header, {
          opacity: [0, 1],
          translateY: [40, 0],
          duration: 800,
          ease: "outQuart",
          autoplay: onScroll({ target: header, repeat: false }),
        }),
      );
    }

    if (ctaLink) {
      bag.add(
        animate(ctaLink, {
          opacity: [0, 1],
          translateX: [30, 0],
          duration: 800,
          ease: "outQuart",
          autoplay: onScroll({ target: ctaLink, repeat: false }),
        }),
      );
    }

    const cards = Array.from(
      section.querySelectorAll<HTMLElement>("[data-anim='card']"),
    );

    cards.forEach((card, i) => {
      const img = card.querySelector<HTMLElement>("[data-anim='card-img']");
      const footer = card.querySelector<HTMLElement>(
        "[data-anim='card-footer']",
      );
      const badge = card.querySelector<HTMLElement>(
        "[data-anim='card-badge']",
      );

      const tl = createTimeline({
        defaults: { ease: "outExpo" },
        autoplay: onScroll({ target: card, repeat: false }),
      });

      tl.add(card, {
        opacity: [0, 1],
        translateY: [70, 0],
        scale: [0.93, 1],
        duration: 900,
        delay: i * 60,
      });

      if (footer) {
        tl.add(
          footer,
          { opacity: [0, 1], translateY: [16, 0], duration: 700 },
          "-=500",
        );
      }

      if (badge) {
        tl.add(
          badge,
          { opacity: [0, 1], scale: [0, 1], duration: 600, ease: "outBack" },
          "-=500",
        );
      }

      bag.add(tl);

      if (img) {
        bag.add(
          animate(img, {
            translateY: [36, -20],
            scale: [1.1, 1],
            ease: "linear",
            autoplay: onScroll({ target: card, sync: true }),
          }),
        );
      }
    });

    return () => bag.flush();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="product"
      className="bg-white px-5 py-18 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div data-anim="header" className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Gói sản phẩm
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-tight">
              Our energy system, simplified.
            </h2>
          </div>
          <div data-anim="cta-link">
            <a
              href="#login"
              className="inline-flex items-center gap-1.5 font-medium text-slate-900 border-b border-slate-900 pb-1 hover:text-emerald-700 hover:border-emerald-700 transition-all duration-300 group"
            >
              Get Personalized Quote
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Product grid */}
        <div className="grid gap-12 md:grid-cols-3">
          {PRODUCT_ITEMS.map((item) => {
            const isMonitoring = item.title.includes("Monitoring");

            return (
              <div
                key={item.title}
                data-anim="card"
                className="group flex flex-col h-full bg-white"
              >
                {/* Image */}
                <div className="relative h-64 sm:h-72 md:h-80 w-full flex items-center justify-center overflow-hidden rounded-lg">
                  <img
                    data-anim="card-img"
                    src={item.image}
                    alt={item.title}
                    className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {isMonitoring && (
                    <div
                      data-anim="card-badge"
                      className="absolute bottom-4 left-4 z-20 w-16 aspect-square bg-white border border-slate-950/10 rounded-xl shadow-md p-1.5 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-rotate-3"
                    >
                      <img
                        src={solarMonitoringImg}
                        alt="Gateway Controller"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 mt-6">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed min-h-[40px] lg:min-h-[48px]">
                    {item.desc}
                  </p>

                  {/* Footer metrics */}
                  <div
                    data-anim="card-footer"
                    className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs"
                  >
                    <div>
                      <span className="block font-semibold tracking-wider text-slate-400 uppercase">
                        Metric:
                      </span>
                      <span className="block mt-1.5 font-medium text-slate-700 leading-normal">
                        {item.metric}
                      </span>
                    </div>
                    <div>
                      <span className="block font-semibold tracking-wider text-slate-400 uppercase">
                        Ideal for:
                      </span>
                      <span className="block mt-1.5 font-medium text-slate-700 leading-normal">
                        {item.idealFor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
