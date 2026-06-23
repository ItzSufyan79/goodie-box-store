export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="skeleton h-10 w-40 rounded-lg mb-8" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-32 rounded-xl" />
        </div>
        <div className="skeleton h-80 rounded-xl" />
      </div>
    </div>
  );
}
