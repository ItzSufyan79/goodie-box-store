export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="skeleton h-10 w-36 rounded-lg mb-8" />
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
        <div className="skeleton h-48 rounded-xl" />
      </div>
    </div>
  );
}
