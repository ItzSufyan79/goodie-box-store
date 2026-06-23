import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextFetchEvent } from "next/server";

type Role = "CUSTOMER" | "SELLER" | "ADMIN";

const publicRoutes = [
  "/",
  "/products",
  "/collections",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

const sellerRoutes = ["/seller"];
const adminRoutes = ["/admin"];
const customerRoutes = ["/cart", "/checkout", "/orders", "/wishlist", "/profile", "/custom-request", "/my-requests"];

function isPublicRoute(pathname: string) {
  return (
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    ) ||
    pathname.startsWith("/products/") ||
    pathname.startsWith("/collections/")
  );
}

function matchesRoutes(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export default auth((req, event: NextFetchEvent) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user?.role as Role) ?? null;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (matchesRoutes(pathname, adminRoutes) && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (matchesRoutes(pathname, sellerRoutes) && role !== "SELLER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (matchesRoutes(pathname, customerRoutes) && role === "ADMIN") {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)"],
};
