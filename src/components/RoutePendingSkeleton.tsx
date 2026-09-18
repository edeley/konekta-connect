export function RoutePendingSkeleton() {
  return (
    <div className="w-full min-h-[40vh] flex flex-col items-center justify-center p-6 space-y-3 animate-pulse">
      <div className="size-9 rounded-xl bg-muted grid place-items-center">
        <span className="size-3.5 rounded-full bg-primary animate-ping" />
      </div>
      <p className="text-xs font-semibold text-muted-foreground">A carregar ecrã...</p>
    </div>
  );
}
