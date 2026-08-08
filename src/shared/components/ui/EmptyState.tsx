import { Inbox, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /** Illustration icon. Defaults to Inbox. */
  icon?: LucideIcon;
  /** Main line. Default: no data yet. */
  title?: string;
  /** Secondary description (optional). */
  description?: string;
  /** CTA (e.g. "Clear filters" / "Create new"). Omit → hides the button. */
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Shared empty state — icon + text + optional CTA.
 * Unifies the ad-hoc "No… / Not yet…" strings written inline on every page.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = "No data yet",
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 py-12 text-center ${className ?? ""}`}
    >
      <Icon className="size-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
