import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/features/landing/landing.constants';
import logoImg from '@/assets/logo.png';

type LandingHeaderProps = {
  scrolled: boolean;
  onLogin: () => void;
};

const LandingHeader = ({ scrolled, onLogin }: LandingHeaderProps) => (
  <header
    className={cn(
      'fixed left-0 right-0 top-0 z-40 px-6 py-4 transition-all duration-300 lg:px-12',
      scrolled
        ? 'border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md'
        : 'border-b border-transparent bg-transparent'
    )}
  >
    <div className="mx-auto grid w-full max-w-7xl grid-cols-3 items-center">
      <nav className="flex items-center justify-start gap-8 text-sm font-medium" aria-label="Primary navigation">
        {NAV_ITEMS.map(item => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              'whitespace-nowrap transition-colors duration-300',
              scrolled ? 'text-slate-600 hover:text-slate-950' : 'text-white/85 hover:text-white'
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex justify-center">
        <a href="#main-content" className="flex h-12 items-center focus:outline-none">
          <img src={logoImg} alt="Sunaria Logo" className="h-full w-auto object-contain transition-all duration-300" />
        </a>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className={cn(
            'h-10 gap-2 border-none bg-transparent p-0 text-sm font-medium transition-all duration-300 hover:bg-transparent',
            scrolled ? 'text-slate-900 hover:text-slate-600' : 'text-white/85 hover:text-white'
          )}
          onClick={onLogin}
        >
          Đăng nhập
          <LockKeyhole className="size-4" />
        </Button>
      </div>
    </div>
  </header>
);

export default LandingHeader;