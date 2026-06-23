export default function WishlistLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="skeleton h-10 w-36 rounded-lg mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden">
            <div className="skeleton aspect-square" />
            <div className="p-4 space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
              <div className="skeleton h-5 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
