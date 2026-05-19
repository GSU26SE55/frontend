import Reveal from '@/features/landing/components/Reveal';
import test1Img from '@/assets/test 1.jpg';

const STATS_DATA = [
  { value: '$1500+', label: 'Average Annual Savings' },
  { value: '5-7 Years', label: 'Payback Period' },
  { value: '$30,000+', label: 'Lifetime Saving' },
] as const;

const StatsSection = () => {
  return (
    <section 
      className="relative w-full h-[450px] sm:h-[600px] lg:h-[720px] bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url("${test1Img}")` }}
    >
      {/* Top seamless transition: fades from solid white to transparent to completely blend with WorkflowSection above */}
      <div 
        className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white via-white/60 to-transparent z-10 pointer-events-none" 
        aria-hidden="true"
      />

      {/* Bottom seamless transition: fades from slate-950 to transparent to blend with RolesSection below */}
      <div 
        className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10 pointer-events-none" 
        aria-hidden="true"
      />

      {/* Soft overall darkening overlay for rich contrast and text readability */}
      <div 
        className="absolute inset-0 bg-slate-950/10 z-0 pointer-events-none" 
        aria-hidden="true"
      />

      {/* Center-bottom stats list, exactly matching the screenshot */}
      <div className="absolute bottom-12 sm:bottom-16 md:bottom-20 left-0 right-0 z-20 w-full px-5">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="grid grid-cols-3 text-center text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              {STATS_DATA.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center justify-center px-2">
                  {/* Clean white bold text */}
                  <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-none">
                    {stat.value}
                  </span>
                  
                  {/* Clean faded sub-label */}
                  <span className="mt-3 text-[10px] sm:text-xs md:text-sm font-medium text-slate-200 tracking-wide opacity-90">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
