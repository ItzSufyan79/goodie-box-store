export default function SellerProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between mb-8">
        <div>
          <div className="skeleton h-10 w-48 rounded-lg mb-2" />
          <div className="skeleton h-5 w-32 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-36 rounded-lg" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
