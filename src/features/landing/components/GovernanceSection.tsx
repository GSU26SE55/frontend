import Reveal from '@/features/landing/components/Reveal';

const GOVERNANCE_CARDS = [
  {
    title: 'High Performance',
    desc: 'Optimized cells for maximum efficiency and yield.',
    isDark: true,
    // Grayscale embossed 3D lightning bolt icon for High Performance
    icon: (
      <div className="flex justify-start items-center h-20">
        <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="darkBoltGrad" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#3c3c3c" />
              <stop offset="40%" stopColor="#1e1e1e" />
              <stop offset="100%" stopColor="#080808" />
            </linearGradient>
            <linearGradient id="boltRibbon" x1="20" y1="50" x2="80" y2="90">
              <stop offset="0%" stopColor="#808080" />
              <stop offset="50%" stopColor="#dcdcdc" />
              <stop offset="100%" stopColor="#303030" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="40" r="26" fill="url(#darkBoltGrad)" stroke="#444" strokeWidth="1" />
          <path d="M52 22 L36 46 H48 L44 62 L64 38 H50 L52 22 Z" fill="url(#boltRibbon)" stroke="#222" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      </div>
    )
  },
  {
    title: 'Delivered on time',
    desc: 'Quick scheduling, packaging, and safe delivery to your site.',
    isDark: false,
    // 3D Starburst Seal clock shape for Delivered on time
    icon: (
      <div className="flex justify-start items-center h-20">
        <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sealGrad" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f3f4f6" />
            </linearGradient>
            <linearGradient id="sealInner" x1="0" y1="0" x2="0" y2="100">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          <path d="M50 15 L56 23 L65 19 L68 28 L77 27 L76 36 L84 38 L80 47 L86 53 L79 60 L81 69 L72 72 L70 81 L61 80 L56 87 L48 82 L40 85 L35 77 L26 77 L25 68 L17 65 L21 56 L15 48 L21 40 L19 31 L28 30 L30 21 L39 23 L44 15 Z" fill="url(#sealGrad)" stroke="#e2e8f0" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="18" fill="none" stroke="url(#sealInner)" strokeWidth="2.5" />
          <line x1="50" y1="50" x2="50" y2="38" stroke="url(#sealInner)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="50" x2="60" y2="50" stroke="url(#sealInner)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    )
  },
  {
    title: 'Eco-friendly',
    desc: 'Carbon neutral manufacturing, supporting global sustainability.',
    isDark: false,
    // 3D Heart/Leaf hybrid shape for Eco-friendly
    icon: (
      <div className="flex justify-start items-center h-20">
        <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="heartGrad" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          <path d="M50 75 L46 71 C28 54 18 44 18 32 C18 22 26 14 36 14 C42 14 47 17 50 21 C53 17 58 14 64 14 C74 14 82 22 82 32 C82 44 72 54 54 71 Z" fill="url(#heartGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M50 23 V72 C51 71 54 68 54 68 C72 52 80 43 80 32 C80 23 73 16 64 16 C58 16 53 19 50 23 Z" fill="#64748b" opacity="0.15" />
        </svg>
      </div>
    )
  },
  {
    title: 'Built to last',
    desc: 'Robust housing and engineering with 25-year limited warranty.',
    isDark: false,
    // 3D Shield shape for Built to last
    icon: (
      <div className="flex justify-start items-center h-20">
        <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="shieldGrad" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          <path d="M50 18 C62 18 74 22 74 36 C74 52 62 66 50 76 C38 66 26 52 26 36 C26 22 38 18 50 18 Z" fill="url(#shieldGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M50 22 V71 C56 65 66 51 66 36 C66 28 58 25 50 25 Z" fill="#64748b" opacity="0.15" />
        </svg>
      </div>
    )
  }
] as const;

const GovernanceSection = () => (
  <section id="governance" className="bg-white px-5 py-18 lg:px-8 lg:py-24">
    <div className="mx-auto max-w-7xl">
      {/* Full width header exactly matching the screenshot style */}
      <Reveal>
        <div className="max-w-3xl mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-700">Chứng nhận chất lượng</p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-tight">
            Validated by
            <br />
            industry leaders.
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-2xl">
            Our hardware and integrated software ecosystem comply with global engineering standards, tested for high performance and durability.
          </p>
        </div>
      </Reveal>

      {/* Grid containing 1 dark and 3 white premium 3D-styled cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {GOVERNANCE_CARDS.map((card, i) => (
          <Reveal key={card.title} delay={i * 80}>
            <div 
              className={`
                group relative h-[300px] rounded-[24px] p-8 flex flex-col justify-between transition-all duration-300
                ${card.isDark 
                  ? 'bg-[#0a0a0a] border border-white/[0.08] shadow-[0_20px_45px_rgba(0,0,0,0.35)] text-white' 
                  : 'bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-300/85 text-slate-900'
                }
              `}
            >
              {/* Premium 3D SVG Icon */}
              <div className="mb-4">
                {card.icon}
              </div>

              {/* Title & Description */}
              <div className="text-left">
                <h3 className={`text-lg font-bold tracking-tight ${card.isDark ? 'text-white' : 'text-slate-900'}`}>
                  {card.title}
                </h3>
                <p className={`mt-2 text-sm leading-relaxed ${card.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {card.desc}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export default GovernanceSection;
