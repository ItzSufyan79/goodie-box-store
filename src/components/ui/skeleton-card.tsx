export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 rounded skeleton" />
        <div className="h-4 w-full rounded skeleton" />
        <div className="h-4 w-3/4 rounded skeleton" />
        <div className="h-5 w-20 rounded skeleton" />
      </div>
    </div>
  );
}
