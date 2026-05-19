import Reveal from '@/features/landing/components/Reveal';
import { WORKFLOW } from '@/features/landing/landing.constants';
import workflow1Img from '@/assets/workflow_1.png';
import workflow2Img from '@/assets/workflow_2.png';
import workflow3Img from '@/assets/workflow_3.png';
import workflow4Img from '@/assets/workflow_4.png';

const WORKFLOW_IMAGES = [workflow1Img, workflow2Img, workflow3Img, workflow4Img];

const WorkflowSection = () => {
  return (
    <section id="workflow" className="bg-white px-5 py-18 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        
        {/* Section Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-700">Quy trình dịch vụ</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl leading-tight">
              We handle everything - start to finish.
            </h2>
            <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">
              From system design to permitting, installation and activation, we take care of it all.
            </p>
          </div>
        </Reveal>

        {/* 2x2 Grid of Immersive Cards */}
        <div className="grid gap-8 sm:grid-cols-2">
          {WORKFLOW.map((item, index) => {
            const bgImage = WORKFLOW_IMAGES[index];
            return (
              <Reveal key={item.step} delay={index * 120}>
                <div className="group relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-slate-400/40">
                  {/* Photo background with parallax scale on hover */}
                  <img
                    src={bgImage}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80"
                    loading="lazy"
                  />

                  {/* Dark gradient overlay for typography readability */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent transition-opacity duration-300 group-hover:opacity-95" 
                    aria-hidden="true"
                  />

                  {/* Content overlay */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                      {/* Glassmorphic step indicator */}
                      <span className="inline-flex items-center justify-center h-8 w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 font-mono text-xs font-semibold text-white mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                        {item.step}
                      </span>
                      
                      <h3 className="text-xl font-bold text-white sm:text-2xl tracking-tight">
                        {item.title}
                      </h3>
                      
                      {/* Smooth slide-up fade-in description on hover */}
                      <p className="mt-3 text-sm text-slate-200 leading-relaxed max-h-0 opacity-0 overflow-hidden group-hover:max-h-24 group-hover:opacity-100 transition-all duration-500 ease-out">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                </div>
              </Reveal>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default WorkflowSection;
