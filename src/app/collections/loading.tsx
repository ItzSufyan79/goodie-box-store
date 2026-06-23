export default function CollectionsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="skeleton h-10 w-48 rounded-lg mb-4" />
      <div className="skeleton h-5 w-64 rounded-lg mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[4/3] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
