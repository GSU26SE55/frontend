interface EmptyStateProps {
  title?: string
  description?: string
}

export function EmptyState({ title = 'Không có dữ liệu', description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-base font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
