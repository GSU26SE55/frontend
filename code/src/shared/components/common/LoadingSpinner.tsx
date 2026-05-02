import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

type LoadingSpinnerProps = {
  label?: string
  className?: string
}

export function LoadingSpinner({ label = 'Đang tải...', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground', className)}>
      <Loader2 className="size-6 animate-spin" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
