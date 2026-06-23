export default function EditProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="skeleton h-10 w-48 rounded-lg mb-2" />
      <div className="skeleton h-5 w-64 rounded-lg mb-8" />
      <div className="skeleton h-[600px] rounded-xl" />
    </div>
  );
}
