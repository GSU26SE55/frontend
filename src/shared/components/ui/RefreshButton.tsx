import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RefreshButtonProps extends VariantProps<typeof buttonVariants> {
  queryKeys: (string | readonly string[])[];
  label?: string;
  className?: string;
}

const ICON_SIZES = ["icon", "icon-xs", "icon-sm", "icon-lg"];

export function RefreshButton({
  queryKeys,
  label = "Refresh",
  className,
  variant = "outline",
  size = "icon-sm",
}: RefreshButtonProps) {
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = async () => {
    setSpinning(true);
    await Promise.all(
      queryKeys.map((key) =>
        queryClient.invalidateQueries({
          queryKey: Array.isArray(key) ? key : [key],
        }),
      ),
    );
    setTimeout(() => setSpinning(false), 600);
  };

  const iconOnly = ICON_SIZES.includes(size ?? "");
  // No explicit size class — Button scales the icon to match its own size variant.
  const icon = <RefreshCw className={cn(spinning && "animate-spin")} />;

  if (!iconOnly) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleRefresh}
        disabled={spinning}
        className={cn(className)}
      >
        {icon}
        {label}
      </Button>
    );
  }

  // Icon-only: the label lives in the tooltip so the action stays discoverable.
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant={variant}
            size={size}
            onClick={handleRefresh}
            disabled={spinning}
            aria-label={label}
            className={cn(className)}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
