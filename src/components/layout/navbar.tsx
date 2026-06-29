"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Gift,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore, useUIStore } from "@/store/cart-store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { RevealLink } from "@/components/animations/reveal-link";

interface NavCategory {
  id: string;
  name: string;
  slug: string;
}

interface NavbarProps {
  categories: NavCategory[];
}

export function Navbar({ categories }: NavbarProps) {
  const { data: session } = useSession();
  const itemCount = useCartStore((s) => s.itemCount);
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" role="banner">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>

            <Link href="/" className="flex items-center gap-2">
              <Gift className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold tracking-tight">
                Goodie<span className="text-primary">Box</span>
              </span>
            </Link>
          </div>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="hidden flex-1 max-w-xl md:flex items-center relative"
            role="search"
            aria-label="Search products"
          >
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search gift boxes, snacks, college essentials..."
              className="pl-10 pr-4 h-10 rounded-full bg-muted/50 border-0 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
            />
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" asChild>
              <Link href="/products">
                <Search className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>

            <ThemeToggle />

            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Link>
            </Button>

            {session ? (
              <div className="relative group">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={
                    session.user.role === "ADMIN"
                      ? "/admin"
                      : session.user.role === "SELLER"
                        ? "/seller"
                        : "/profile"
                  }>
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt=""
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </Link>
                </Button>
              </div>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Category nav */}
        <nav className="hidden lg:flex items-center gap-6 h-10 border-t text-sm" aria-label="Main navigation">
          {categories.map((cat) => (
            <RevealLink
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              {cat.name}
            </RevealLink>
          ))}
          <RevealLink
            href="/collections"
            className="text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-1"
          >
            Gift Guides <ChevronDown className="h-3 w-3" />
          </RevealLink>
        </nav>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t overflow-hidden bg-background"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              <form onSubmit={handleSearch} className="mb-4">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="block py-2 text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
              {session && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
