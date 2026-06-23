export default function CartLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="skeleton h-10 w-32 rounded-lg mb-8" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border rounded-xl">
              <div className="skeleton h-24 w-24 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/4 rounded" />
                <div className="skeleton h-8 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    </div>
  );
}
