export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
