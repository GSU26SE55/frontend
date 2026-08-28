import { useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { PanelLeftClose, PanelLeftOpen, ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DIST, DUR, EASE_OUT, SPRING } from "@/shared/motion/tokens";
import logoImg from "@/assets/logo.webp";

/**
 * A count pill on a nav item. `tone` picks the colour:
 * - "danger" (red) — a real alarm someone must clear: unresolved battery alerts and
 *   environmental incidents.
 * - "warning" (amber) — work waiting on a person but not an emergency: guide articles
 *   awaiting approval. Matches the amber used by the pending-approval notice and the
 *   "Pending change" badge on the article cards, so one idea keeps one colour.
 * - "muted" (grey) — merely unfinished work, e.g. drafts. A draft is nobody's alarm, so
 *   it must not read as one.
 */
export interface NavBadge {
  value: string | number;
  tone?: "danger" | "warning" | "muted";
  /** Tooltip text — says what the number means, since the pill itself is just a digit. */
  title?: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /**
   * One pill, or several shown side by side (e.g. Guide carries both "awaiting approval"
   * and "drafts"). A bare string/number stays supported so existing nav configs and the
   * Inbox badge keep working unchanged.
   */
  badge?: string | number | NavBadge[];
  /**
   * Extra route subtrees this item owns but does not link to. Some detail pages live
   * under a path the nav never names — battery detail is /{role}/battery-assets/:id but
   * is reached through Sites, so nothing in the nav is a prefix of it and the whole
   * sidebar would show no active item there. Listing the subtree here keeps the item
   * that owns the page highlighted. Matched exactly like `path` (self or child route).
   */
  activePaths?: string[];
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
  /**
   * Namespaces the per-section open/closed state saved in localStorage. Section titles
   * are NOT unique across roles ("System" is shared by all three), and localStorage is
   * keyed by origin rather than by user — so without this, an Admin collapsing "System"
   * (10 items) would leave it collapsed for the next Staff login on the same browser,
   * and vice versa. Pass the role.
   */
  scopeKey: string;
}

// Active when pathname matches item.path exactly or is a child route of it (e.g. the
// "Tickets" item /manager/tickets stays active on the detail page /manager/tickets/:id),
// or matches one of the extra subtrees the item claims via `activePaths`.
// When another sidebar item has a MORE SPECIFIC path that also matches (e.g. "Queue"
// /manager/tickets/queue is a child of "Tickets"), only the more specific item is
// active — avoids two items lighting up at once when on /manager/tickets/queue.
function isPathActive(
  item: NavItem,
  pathname: string,
  allPaths: string[],
): boolean {
  const matches = (p: string) => pathname === p || pathname.startsWith(`${p}/`);
  // The path the match came through — an `activePaths` subtree is checked for a more
  // specific sibling against ITSELF, not against item.path, which it sits outside of.
  const matched = [item.path, ...(item.activePaths ?? [])].find(matches);
  if (matched === undefined) return false;
  return !allPaths.some(
    (other) =>
      other !== matched && other.startsWith(`${matched}/`) && matches(other),
  );
}

// Sidebar state used to be saved under `sidebar-section-{title}`, with no role in the
// key — so all three roles shared one entry and overwrote each other's. The keys are now
// role-scoped; this drops the old unscoped ones so they do not sit in localStorage
// forever. Runs once per page load, before any Section reads its state.
let legacyKeysPurged = false;
function purgeLegacySectionKeys() {
  if (legacyKeysPurged) return;
  legacyKeysPurged = true;
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith("sidebar-section-")) continue;
      const rest = key.slice("sidebar-section-".length);
      if (!/^([A-Z]{2,}|anon)-/.test(rest)) localStorage.removeItem(key);
    }
  } catch {
    // localStorage can throw in private mode / when storage is full — a failed cleanup
    // must never keep the sidebar from rendering.
  }
}

// ── Collapsible section ─────────────────────────────────────────────────────
function Section({
  section,
  index,
  navId,
  sidebarCollapsed,
  allPaths,
  pathname,
  scopeKey,
}: {
  section: NavSection;
  index: number;
  navId: string;
  sidebarCollapsed: boolean;
  allPaths: string[];
  pathname: string;
  scopeKey: string;
}) {
  const storageKey = section.title
    ? `sidebar-section-${scopeKey}-${section.title}`
    : null;
  const [open, setOpen] = useState(() => {
    purgeLegacySectionKeys();
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

  const reduced = useReducedMotion();
  const isCollapsible =
    !!section.collapsible && !!section.title && !sidebarCollapsed;

  return (
    <div
      className={cn("w-full", sidebarCollapsed && "flex flex-col items-center")}
    >
      {/* Section header */}
      {section.title &&
        !sidebarCollapsed &&
        (isCollapsible ? (
          <button
            onClick={handleToggle}
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-md mb-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group"
          >
            <span className="text-3xs font-semibold uppercase tracking-widest">
              {section.title}
            </span>
            <ChevronDown
              size={12}
              className="transition-transform duration-200"
              style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
            />
          </button>
        ) : (
          <p className="px-2.5 py-1.5 mb-0.5 text-3xs font-semibold uppercase tracking-widest text-muted-foreground">
            {section.title}
          </p>
        ))}

      {/* Items */}
      <div
        className={cn(
          "w-full grid transition-[grid-template-rows,opacity] duration-200",
          !sidebarCollapsed && !open && "grid-rows-[0fr] opacity-0",
          (sidebarCollapsed || open) && "grid-rows-[1fr] opacity-100",
        )}
      >
        {/* Items rise into place on mount, bottom item last. The sidebar never remounts
            on navigation, so this plays once when the shell loads, not on every route. */}
        <motion.ul
          initial={reduced ? false : "hidden"}
          animate="shown"
          variants={{
            shown: {
              transition: {
                staggerChildren: 0.03,
                delayChildren: 0.05 * index,
              },
            },
          }}
          className={cn(
            "w-full space-y-0.5 overflow-hidden min-h-0",
            sidebarCollapsed && "flex flex-col items-center",
          )}
        >
          {section.items.map((item) => {
            const active = isPathActive(item, pathname, allPaths);
            const link = (
              <Link
                to={item.path}
                replace
                className={cn(
                  "group flex items-center rounded-lg transition-[color,background-color,border-color,box-shadow] duration-(--motion-state) ease-strong relative",
                  sidebarCollapsed
                    ? "size-10 justify-center p-0"
                    : "w-full gap-2.5 px-2.5 py-1.75 text-2sm",
                  active
                    ? "text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {/* One highlight for the whole nav: it travels to the item you picked
                    instead of fading out here and fading in there. */}
                {active && (
                  <motion.span
                    aria-hidden="true"
                    {...(reduced
                      ? {}
                      : { layoutId: `${navId}-active`, transition: SPRING })}
                    className="absolute inset-0 rounded-lg bg-sidebar-accent shadow-xs"
                  />
                )}
                <item.icon
                  size={sidebarCollapsed ? 18 : 15}
                  className={cn(
                    "relative shrink-0 transition-transform duration-200",
                    active
                      ? cn("text-primary", !sidebarCollapsed && "scale-110")
                      : "text-muted-foreground group-hover:scale-105",
                  )}
                />
                {!sidebarCollapsed && (
                  <>
                    {/* Labels mount when the rail expands, so they slide out from behind
                        the icon rather than snapping into existence at full width. */}
                    <motion.span
                      className="relative flex-1 truncate"
                      initial={reduced ? false : { opacity: 0, x: -DIST.sm }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: { duration: DUR.enter, ease: EASE_OUT },
                      }}
                    >
                      {item.label}
                    </motion.span>
                    {item.badge !== undefined && (
                      <motion.span
                        className="relative shrink-0 flex items-center gap-1"
                        initial={reduced ? false : { opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1, transition: SPRING }}
                      >
                        {(Array.isArray(item.badge)
                          ? item.badge
                          : [{ value: item.badge, tone: "danger" as const }]
                        ).map((b, i) => (
                          <span
                            key={i}
                            title={b.title}
                            className={cn(
                              "text-3xs font-bold px-1.5 py-[1px] rounded-full leading-none",
                              b.tone === "muted" &&
                                "bg-muted text-muted-foreground",
                              b.tone === "warning" &&
                                "bg-amber-500/10 text-amber-600 dark:text-amber-500",
                              (!b.tone || b.tone === "danger") &&
                                "bg-destructive/10 text-destructive",
                            )}
                          >
                            {b.value}
                          </span>
                        ))}
                      </motion.span>
                    )}
                  </>
                )}
              </Link>
            );
            return (
              <motion.li
                key={item.path}
                variants={{
                  hidden: { opacity: 0, y: DIST.md },
                  shown: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: DUR.enter, ease: EASE_OUT },
                  },
                }}
                className={cn(
                  "w-full",
                  sidebarCollapsed && "flex justify-center",
                )}
              >
                {/* Collapsed, the label is the only thing telling you what an icon is —
                    a real tooltip instead of the browser's half-second `title`. */}
                {sidebarCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger render={link} />
                    <TooltipContent side="right" sideOffset={10}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </motion.li>
            );
          })}
        </motion.ul>
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
  scopeKey,
}: SidebarProps) {
  const { pathname } = useLocation();
  // Every path any item can be active on — both linked paths and claimed subtrees — so
  // the more-specific-sibling check above sees the claimed ones too.
  const allPaths = sections.flatMap((s) =>
    s.items.flatMap((i) => [i.path, ...(i.activePaths ?? [])]),
  );
  // `layoutId` is global — scope it per nav so two sidebars could never fight over one
  // highlight.
  const navId = useId();
  const [logoHovered, setLogoHovered] = useState(false);
  const reduced = useReducedMotion();

  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 h-screen border-r bg-sidebar text-sidebar-foreground transition-[width] duration-(--motion-enter) ease-strong",
        collapsed ? "w-14 items-center" : "w-55",
      )}
    >
      {/* ── Logo header ── */}
      <div
        className={cn(
          "flex items-center h-14 border-b shrink-0 w-full",
          collapsed ? "justify-center px-0" : "px-4 gap-2.5",
        )}
      >
        {collapsed ? (
          // Collapsed, the logo IS the open button — but nothing said so. Pointing at it
          // now swaps the mark for the panel icon, so the affordance shows itself.
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className="relative size-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors p-0.5"
                  onClick={onToggle}
                  aria-label="Expand sidebar"
                  onPointerEnter={() => setLogoHovered(true)}
                  onPointerLeave={() => setLogoHovered(false)}
                  onFocus={() => setLogoHovered(true)}
                  onBlur={() => setLogoHovered(false)}
                />
              }
            >
              <AnimatePresence initial={false}>
                <motion.span
                  key={logoHovered ? "toggle" : "logo"}
                  aria-hidden="true"
                  className="absolute inset-0 grid place-items-center"
                  initial={reduced ? false : { opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1, transition: SPRING }}
                  exit={{
                    opacity: 0,
                    scale: 0.7,
                    transition: { duration: DUR.state, ease: EASE_OUT },
                  }}
                >
                  {logoHovered ? (
                    <PanelLeftOpen size={17} />
                  ) : (
                    <img
                      src={logoImg}
                      alt="Logo"
                      className="h-7 w-7 shrink-0 object-contain"
                    />
                  )}
                </motion.span>
              </AnimatePresence>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              Expand sidebar
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <img
              src={logoImg}
              alt="Logo"
              className="h-8 w-8 shrink-0 object-contain"
            />

            <div className="flex-1 min-w-0">
              <div className="text-3xs text-muted-foreground tracking-wide uppercase">
                {appName}
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                    onClick={onToggle}
                    aria-label="Collapse sidebar"
                  />
                }
              >
                <PanelLeftClose size={15} />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                Collapse sidebar
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto py-3 space-y-3 w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          collapsed ? "flex flex-col items-center px-0" : "px-2",
        )}
      >
        {sections.map((section, si) => (
          <Section
            key={si}
            index={si}
            navId={navId}
            section={section}
            sidebarCollapsed={collapsed}
            allPaths={allPaths}
            pathname={pathname}
            scopeKey={scopeKey}
          />
        ))}
      </nav>
    </aside>
  );
}
