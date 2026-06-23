import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Role = "CUSTOMER" | "SELLER" | "ADMIN";

const authSecret = process.env.AUTH_SECRET;

const publicRoutes = [
  "/",
  "/products",
  "/collections",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: authSecret,
  });
  const role = token?.role as Role | undefined;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (matchesRoutes(pathname, adminRoutes) && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (matchesRoutes(pathname, sellerRoutes) && role !== "SELLER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (matchesRoutes(pathname, customerRoutes) && role === "ADMIN") {
    // admins can access customer routes too
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)"],
};
