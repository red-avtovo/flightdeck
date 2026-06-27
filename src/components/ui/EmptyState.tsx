interface EmptyStateProps {
  message?: string
}

export function EmptyState({ message = 'No data available' }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[120px] text-slate-500 text-sm">
      {message}
    </div>
  )
}
