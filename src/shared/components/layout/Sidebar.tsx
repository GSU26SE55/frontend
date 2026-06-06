import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { PanelLeftClose, PanelLeftOpen, Zap, HelpCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  path:  string;
  icon:  LucideIcon;
  badge?: string | number;
}

export interface NavSection {
  title?:       string;
  items:        NavItem[];
  collapsible?: boolean;   // section header is click-to-toggle
  defaultOpen?: boolean;   // initial expanded state (default true)
}

interface SidebarProps {
  appName:  string;
  sections: NavSection[];
  collapsed: boolean;
  onToggle:  () => void;
}

// ── Collapsible section ────────────────────────────────────────────────────
function Section({
  section,
  sidebarCollapsed,
}: {
  section: NavSection;
  sidebarCollapsed: boolean;
}) {
  const storageKey = section.title ? `sidebar-section-${section.title}` : null;
  const [open, setOpen] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) return saved === 'true';
    }
    return section.defaultOpen ?? true;
  });

  const handleToggle = () => {
    setOpen((v) => {
      const next = !v;
      if (storageKey) localStorage.setItem(storageKey, String(next));
      return next;
    });
  };

  const isCollapsible = !!section.collapsible && !!section.title && !sidebarCollapsed;

  return (
    <div>
      {/* Section header */}
      {section.title && !sidebarCollapsed && (
        isCollapsible ? (
          <button
            onClick={handleToggle}
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-md mb-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group"
          >
            <span className="text-[10.5px] font-semibold uppercase tracking-widest">{section.title}</span>
            <ChevronDown
              size={12}
              className="transition-transform duration-200"
              style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            />
          </button>
        ) : (
          <p className="px-2.5 py-1.5 mb-0.5 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
            {section.title}
          </p>
        )
      )}

      {/* Items */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: open ? `${section.items.length * 42}px` : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <ul className="space-y-[2px]">
          {section.items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path.split('/').length <= 2}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-colors duration-100',
                    sidebarCollapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <item.icon size={15} className="shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-[1px] rounded-full bg-red-100 text-red-600 leading-none">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
export default function Sidebar({ appName, sections, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col shrink-0 h-screen border-r bg-sidebar text-sidebar-foreground transition-all duration-200',
        collapsed ? 'w-14' : 'w-[220px]',
      )}
    >
      {/* ── Logo header ── */}
      <div
        className={cn(
          'flex items-center h-14 border-b shrink-0',
          collapsed ? 'justify-center' : 'px-4 gap-2.5',
        )}
      >
        {collapsed ? (
          <button
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={onToggle}
            title="Mở menu"
          >
            <PanelLeftOpen size={16} />
          </button>
        ) : (
          <>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-emerald-600 text-white">
              <Zap size={15} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight tracking-tight">{appName}</div>
              <div className="text-[10px] text-muted-foreground tracking-wide uppercase mt-0.5">Battery Ops</div>
            </div>
            <button
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              onClick={onToggle}
              title="Thu gọn"
            >
              <PanelLeftClose size={15} />
            </button>
          </>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
        {sections.map((section, si) => (
          <Section key={si} section={section} sidebarCollapsed={collapsed} />
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t p-2">
        <button
          className={cn(
            'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? 'Trợ giúp' : undefined}
        >
          <HelpCircle size={14} className="shrink-0" />
          {!collapsed && 'Trợ giúp & phím tắt'}
        </button>
      </div>
    </aside>
  );
}
