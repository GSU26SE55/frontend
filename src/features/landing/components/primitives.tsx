import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Badge

type BadgeTone = 'neutral' | 'critical' | 'warning';

export const Badge = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) => {
  const toneClass = {
    neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200',
    critical: 'bg-red-50 text-red-700 ring-red-200',
  }[tone];

  return (
    <span className={cn('inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium ring-1', toneClass)}>
      {children}
    </span>
  );
};

// SectionHeader

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  desc?: string;
  className?: string;
};

export const SectionHeader = ({ eyebrow, title, desc, className }: SectionHeaderProps) => (
  <div className={cn('max-w-3xl', className)}>
    <p className="mb-3 text-sm font-medium text-emerald-700">{eyebrow}</p>
    <h2 className="text-3xl font-semibold leading-tight text-slate-950 lg:text-4xl">{title}</h2>
    {desc && <p className="mt-4 text-base leading-7 text-slate-600">{desc}</p>}
  </div>
);
