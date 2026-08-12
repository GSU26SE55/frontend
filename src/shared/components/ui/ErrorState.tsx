import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  /** Message to display. Defaults to a generic load-failure message. */
  message?: string;
  /** Called when "Retry" is clicked. Not passed → button is hidden. */
  onRetry?: () => void;
  className?: string;
}

/**
 * Shared error state for list/detail views when the query is `isError`.
 * Previously many pages ignored isError → network errors were mistakenly shown as an empty state.
 */
export function ErrorState({
  message = "Couldn't load data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className ?? ""}`}
    >
      <AlertTriangle className="size-8 text-destructive/70" />
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
