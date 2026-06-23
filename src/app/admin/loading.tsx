export default function AdminDashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="skeleton h-10 w-64 rounded-lg mb-2" />
      <div className="skeleton h-5 w-48 rounded-lg mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="skeleton h-80 rounded-xl" />
        <div className="skeleton h-80 rounded-xl" />
      </div>
    </div>
  );
}
