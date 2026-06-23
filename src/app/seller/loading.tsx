export default function SellerDashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between mb-8">
        <div>
          <div className="skeleton h-10 w-64 rounded-lg mb-2" />
          <div className="skeleton h-5 w-48 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-80 rounded-xl" />
    </div>
  );
}
