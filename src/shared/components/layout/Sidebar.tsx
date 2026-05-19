import { NavLink, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSessionStore } from '@/shared/stores/sessionStore';
import { clearTokens } from '@/shared/lib/axios';

export interface NavItem {
  label: string;
  path:  string;
  icon:  LucideIcon;
}

export interface NavSection {
  title?: string;
  items:  NavItem[];
}

interface SidebarProps {
  appName:  string;
  sections: NavSection[];
}

export default function Sidebar({ appName, sections }: SidebarProps) {
  const navigate     = useNavigate();
  const { user, clearSession } = useSessionStore();

  const handleLogout = () => {
    clearTokens();
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="flex flex-col w-56 shrink-0 h-screen border-r bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-14 border-b">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
          {appName.slice(0, 1)}
        </div>
        <span className="font-semibold text-sm truncate">{appName}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="px-2 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path.split('/').length <= 2}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    <item.icon size={16} className="shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    <ChevronRight size={12} className="shrink-0 opacity-40" />
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <Separator />

      {/* Footer — user info + logout */}
      <div className="p-3 space-y-1">
        {user && (
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium truncate">{user.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut size={14} />
          Đăng xuất
        </Button>
      </div>
    </aside>
  );
}
