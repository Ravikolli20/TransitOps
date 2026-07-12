interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
}

const toneClasses: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

export function KpiCard({ label, value, hint, tone = 'default' }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClasses[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
