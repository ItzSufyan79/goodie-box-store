export default function MyRequestsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-9 w-64 bg-muted rounded-lg mb-2 animate-pulse" />
          <div className="h-5 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-xl p-6">
            <div className="h-6 w-48 bg-muted rounded mb-2 animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded mb-4 animate-pulse" />
            <div className="h-4 w-full bg-muted rounded mb-2 animate-pulse" />
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
