import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RefreshButtonProps extends VariantProps<typeof buttonVariants> {
  queryKeys: (string | readonly string[])[];
  label?: string;
  className?: string;
}

export function RefreshButton({
  queryKeys,
  label = "Làm mới",
  className,
  variant = "outline",
  size = "sm",
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

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={spinning}
      className={cn(className)}
    >
      <RefreshCw className={cn("h-4 w-4", spinning && "animate-spin")} />
      {size !== "icon" &&
        size !== "icon-sm" &&
        size !== "icon-xs" &&
        size !== "icon-lg" &&
        label}
    </Button>
  );
}
