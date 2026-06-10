import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";
import solarOnlyImg from "@/assets/solar_only.png";
import solarBatteryImg from "@/assets/solar_battery.png";
import solarMonitoringImg from "@/assets/solar_monitoring.png";

gsap.registerPlugin(ScrollTrigger, useGSAP);

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

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReduced) return;

      // Header slide-up + fade
      gsap.from("[data-gsap='header']", {
        y: 40,
        autoAlpha: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "[data-gsap='header']",
          start: "top 85%",
          end: "top 55%",
          scrub: 0.6,
        },
      });

      // CTA link slide-in from right
      gsap.from("[data-gsap='cta-link']", {
        x: 30,
        autoAlpha: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "[data-gsap='header']",
          start: "top 80%",
          end: "top 50%",
          scrub: 0.6,
        },
      });

      // Each product card: staggered scroll-driven entrance
      const cards = gsap.utils.toArray<HTMLElement>("[data-gsap='card']");
      cards.forEach((card, i) => {
        const img = card.querySelector("[data-gsap='card-img']");
        const footer = card.querySelector("[data-gsap='card-footer']");
        const badge = card.querySelector("[data-gsap='card-badge']");

        // Card body: fade + slide up + scale
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            end: "top 40%",
            scrub: 0.5,
          },
        });

        tl.from(card, {
          y: 70,
          autoAlpha: 0,
          scale: 0.93,
          duration: 1,
          ease: "power2.out",
          delay: i * 0.08,
        });

        // Image parallax: moves slower than content
        if (img) {
          gsap.fromTo(
            img,
            { yPercent: 8, scale: 1.08 },
            {
              yPercent: -4,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        }

        // Footer metrics: delayed reveal within card
        if (footer) {
          gsap.from(footer, {
            y: 16,
            autoAlpha: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 60%",
              end: "top 30%",
              scrub: 0.5,
            },
          });
        }

        // Monitoring badge
        if (badge) {
          gsap.from(badge, {
            scale: 0,
            autoAlpha: 0,
            duration: 0.6,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: card,
              start: "top 50%",
              end: "top 25%",
              scrub: 0.5,
            },
          });
        }
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="product" className="bg-white px-5 py-18 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div data-gsap="header" className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Gói sản phẩm
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-tight">
              Our energy system, simplified.
            </h2>
          </div>
          <div data-gsap="cta-link">
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
                data-gsap="card"
                className="group flex flex-col h-full bg-white will-change-transform"
                style={{ visibility: "hidden" }}
              >
                {/* Image */}
                <div className="relative h-64 sm:h-72 md:h-80 w-full flex items-center justify-center overflow-hidden rounded-lg">
                  <img
                    data-gsap="card-img"
                    src={item.image}
                    alt={item.title}
                    className="h-full w-auto object-contain will-change-transform transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {isMonitoring && (
                    <div
                      data-gsap="card-badge"
                      className="absolute bottom-4 left-4 z-20 w-16 aspect-square bg-white border border-slate-950/10 rounded-xl shadow-md p-1.5 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-rotate-3"
                      style={{ visibility: "hidden" }}
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
                    data-gsap="card-footer"
                    className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs"
                    style={{ visibility: "hidden" }}
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
