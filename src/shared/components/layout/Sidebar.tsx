import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { PanelLeftClose, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.webp";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
  collapsible?: boolean; // section header is click-to-toggle
  defaultOpen?: boolean; // initial expanded state (default true)
}

interface SidebarProps {
  appName: string;
  sections: NavSection[];
  collapsed: boolean;
  onToggle: () => void;
}

// Active when pathname matches item.path exactly or is a child route of it (e.g. the
// "Tickets" item /manager/tickets stays active on the detail page /manager/tickets/:id).
// When another sidebar item has a MORE SPECIFIC path that also matches (e.g. "Queue"
// /manager/tickets/queue is a child of "Tickets"), only the more specific item is
// active — avoids two items lighting up at once when on /manager/tickets/queue.
function isPathActive(
  path: string,
  pathname: string,
  allPaths: string[],
): boolean {
  const matches = (p: string) => pathname === p || pathname.startsWith(`${p}/`);
  if (!matches(path)) return false;
  return !allPaths.some(
    (other) => other !== path && other.startsWith(`${path}/`) && matches(other),
  );
}

// ── Collapsible section ─────────────────────────────────────────────────────
function Section({
  section,
  sidebarCollapsed,
  allPaths,
  pathname,
}: {
  section: NavSection;
  sidebarCollapsed: boolean;
  allPaths: string[];
  pathname: string;
}) {
  const storageKey = section.title ? `sidebar-section-${section.title}` : null;
  const [open, setOpen] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) return saved === "true";
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

  const isCollapsible =
    !!section.collapsible && !!section.title && !sidebarCollapsed;

  return (
    <div>
      {/* Section header */}
      {section.title &&
        !sidebarCollapsed &&
        (isCollapsible ? (
          <button
            onClick={handleToggle}
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-md mb-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group"
          >
            <span className="text-[10.5px] font-semibold uppercase tracking-widest">
              {section.title}
            </span>
            <ChevronDown
              size={12}
              className="transition-transform duration-200"
              style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
            />
          </button>
        ) : (
          <p className="px-2.5 py-1.5 mb-0.5 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
            {section.title}
          </p>
        ))}

      {/* Items — when the sidebar is collapsed, always show full icons regardless of
          the section's open/close state (open only matters for hiding/showing labels
          when the sidebar is expanded — collapsed has no label to close). */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={
          sidebarCollapsed
            ? undefined
            : {
                maxHeight: open ? `${section.items.length * 42}px` : "0px",
                opacity: open ? 1 : 0,
              }
        }
      >
        <ul className="space-y-0.5">
          {section.items.map((item) => {
            const active = isPathActive(item.path, pathname, allPaths);
            return (
              <li key={item.path} className="relative">
                <Link
                  to={item.path}
                  replace
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.75 text-[13px] transition-all duration-150 relative overflow-hidden",
                    sidebarCollapsed && "justify-center px-2",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <item.icon
                    size={15}
                    className={cn(
                      "shrink-0 transition-transform duration-200",
                      active
                        ? "text-primary scale-110"
                        : "text-muted-foreground group-hover:scale-105",
                    )}
                  />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-[1px] rounded-full bg-destructive/10 text-destructive leading-none">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({
  appName,
  sections,
  collapsed,
  onToggle,
}: SidebarProps) {
  const { pathname } = useLocation();
  const allPaths = sections.flatMap((s) => s.items.map((i) => i.path));

  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 h-screen border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-14" : "w-55",
      )}
    >
      {/* ── Logo header ── */}
      <div
        className={cn(
          "flex items-center h-14 border-b shrink-0",
          collapsed ? "justify-center" : "px-4 gap-2.5",
        )}
      >
        {collapsed ? (
          <button
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors p-0.5 group"
            onClick={onToggle}
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <img
              src={logoImg}
              alt="Logo"
              className="h-7 w-7 shrink-0 object-contain group-hover:scale-105 transition-transform"
            />
          </button>
        ) : (
          <>
            <img
              src={logoImg}
              alt="Logo"
              className="h-8 w-8 shrink-0 object-contain"
            />

            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-muted-foreground tracking-wide uppercase">
                {appName}
              </div>
            </div>

            <button
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              onClick={onToggle}
              title="Collapse"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          </>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-2 space-y-3"
        style={{ scrollbarGutter: "stable" }}
      >
        {sections.map((section, si) => (
          <Section
            key={si}
            section={section}
            sidebarCollapsed={collapsed}
            allPaths={allPaths}
            pathname={pathname}
          />
        ))}
      </nav>

      {/* ── Footer ──
      <div className="border-t p-2">
        <button
          className={cn(
            "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? "Help" : undefined}
        >
          <HelpCircle size={14} className="shrink-0" />
          {!collapsed && "Help & shortcuts"}
        </button>
      </div> */}
    </aside>
  );
}
