export default function CustomRequestLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="skeleton h-10 w-64 rounded-lg mb-4" />
      <div className="skeleton h-5 w-96 rounded-lg mb-8" />
      <div className="skeleton h-[500px] rounded-xl" />
    </div>
  );
}
