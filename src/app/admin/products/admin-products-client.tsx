"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Package, Eye, Edit, Trash2, Star, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  toggleProductStatusAction,
  toggleFeaturedAction,
  deleteProductAction,
} from "@/actions/products";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  inventory: number;
  isActive: boolean;
  isFeatured: boolean;
  isCustomizable: boolean;
  image: string;
  category: string;
  seller: string;
  sellerId: string;
  orderCount: number;
  reviewCount: number;
  createdAt: string;
}

interface AdminProductsClientProps {
  products: Product[];
  total: number;
  pages: number;
  page: number;
  search: string;
}

export function AdminProductsClient({ products, total, pages, page, search }: AdminProductsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set("search", searchInput.trim());
    router.push(`/admin/products?${params.toString()}`);
  };

  const toggleStatus = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleProductStatusAction(id, !current);
      router.refresh();
    });
  };

  const toggleFeatured = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleFeaturedAction(id, !current);
      router.refresh();
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteProductAction(id);
      router.refresh();
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">{total} total products</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, brand, seller..."
            className="pl-9"
          />
        </div>
        <Button type="submit" size="sm">Search</Button>
      </form>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">Product</th>
                  <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Category</th>
                  <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Seller</th>
                  <th className="text-right py-3 px-4 font-medium">Price</th>
                  <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">Stock</th>
                  <th className="text-center py-3 px-4 font-medium">Active</th>
                  <th className="text-center py-3 px-4 font-medium hidden lg:table-cell">Featured</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                          {product.image && (
                            <Image src={product.image} alt="" fill className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{product.title}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <Badge variant="outline">{product.category}</Badge>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-xs">
                      {product.seller}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatPrice(product.price)}
                    </td>
                    <td className="py-3 px-4 text-right hidden sm:table-cell">
                      <span className={product.inventory <= 5 ? "text-destructive font-medium" : ""}>
                        {product.inventory}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleStatus(product.id, product.isActive)}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                          product.isActive
                            ? "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            : "border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                        }`}
                      >
                        {product.isActive ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                        {product.isActive ? "On" : "Off"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center hidden lg:table-cell">
                      <button
                        onClick={() => toggleFeatured(product.id, product.isFeatured)}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                          product.isFeatured
                            ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                            : "border-gray-300 text-gray-500 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <Star className={`h-3 w-3 ${product.isFeatured ? "fill-amber-400" : ""}`} />
                        {product.isFeatured ? "On" : "Off"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/products/${product.slug}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/seller/products/${product.slug}/edit`}>
                            <Edit className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(product.id, product.title)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      {search ? "No products match your search" : "No products yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              className="w-9"
              onClick={() => {
                const params = new URLSearchParams();
                if (search) params.set("search", search);
                if (p > 1) params.set("page", String(p));
                router.push(`/admin/products?${params.toString()}`);
              }}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
