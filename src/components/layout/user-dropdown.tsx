"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  LayoutDashboard,
  Package,
  Heart,
  LogOut,
  ShoppingBag,
  Gift,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnClickOutside } from "@/hooks/use-click-outside";

export function UserDropdown() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  if (!session?.user) return null;

  const role = session.user.role;
  const isSellerOrAdmin = role === "SELLER" || role === "ADMIN";
  const dashboardLink = role === "ADMIN" ? "/admin" : "/seller";

  const items = [
    ...(isSellerOrAdmin
      ? [{ icon: LayoutDashboard, label: "Dashboard", href: dashboardLink }]
      : []),
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Package, label: "Orders", href: "/orders" },
    { icon: Heart, label: "Wishlist", href: "/wishlist" },
    { icon: ShoppingBag, label: "My Requests", href: "/my-requests" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="size-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        aria-label="User menu"
        aria-expanded={open}
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <User className="h-5 w-5" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-popover shadow-lg overflow-hidden origin-top-right"
          >
            <div className="p-3 border-b bg-muted/30">
              <p className="text-sm font-medium truncate">{session.user.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              <span className="inline-block mt-1 text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                {role}
              </span>
            </div>
            <div className="p-1.5 space-y-0.5">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  <item.icon className="size-4 text-muted-foreground" />
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t p-1.5">
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
