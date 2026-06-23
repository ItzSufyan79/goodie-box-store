export default function OrdersLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="skeleton h-10 w-36 rounded-lg mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
