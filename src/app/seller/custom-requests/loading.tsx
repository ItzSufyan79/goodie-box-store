export default function CustomRequestsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-10 w-10 bg-muted rounded animate-pulse" />
        <div>
          <div className="h-9 w-48 bg-muted rounded mb-2 animate-pulse" />
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="border rounded-xl p-6">
        <div className="h-6 w-36 bg-muted rounded mb-4 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-5 w-40 bg-muted rounded mb-2 animate-pulse" />
              <div className="h-4 w-full bg-muted rounded mb-2 animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
