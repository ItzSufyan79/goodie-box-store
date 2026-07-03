"use client";

export function SortSelect({ value }: { value: string }) {
  return (
    <select
      defaultValue={value}
      onChange={(e) => {
        const params = new URLSearchParams(window.location.search);
        params.set("sort", e.target.value);
        window.location.search = params.toString();
      }}
      className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
    >
      <option value="newest">Newest</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
      <option value="name_asc">Name: A to Z</option>
    </select>
  );
}