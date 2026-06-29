import { SkeletonCard } from "@/components/ui/skeleton-card";

export default function RootLoading() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Hero skeleton */}
        <div className="h-[50vh] rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 animate-pulse" />

        {/* Section skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>

        {/* Second section skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={`b-${i}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
