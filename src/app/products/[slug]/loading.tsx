export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-10 mb-16">
        <div className="skeleton aspect-square rounded-2xl" />
        <div className="space-y-4">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-10 w-3/4 rounded-lg" />
          <div className="skeleton h-5 w-32 rounded" />
          <div className="skeleton h-12 w-28 rounded-lg" />
          <div className="skeleton h-24 w-full rounded-lg" />
          <div className="skeleton h-12 w-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
