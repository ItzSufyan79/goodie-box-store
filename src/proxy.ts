import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

interface AuthRequest extends NextRequest {
  auth: Session | null;
}

type Role = "CUSTOMER" | "SELLER" | "ADMIN";

const publicRoutes = [
  "/",
  "/products",
  "/collections",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/check-email",
  "/verify-email",
  "/resend-verification",
  "/2fa",
  "/api/auth",
  "/api/products",
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

function addCspHeaders(request: NextRequest, response: NextResponse) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com https://checkout.razorpay.com https://api.razorpay.com https://js.stripe.com${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data: https://res.cloudinary.com;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src https://challenges.cloudflare.com https://*.razorpay.com https://js.stripe.com;
    connect-src 'self' https://api.razorpay.com;
    upgrade-insecure-requests;
  `;
  const value = cspHeader.replace(/\s{2,}/g, " ").trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", value);

  response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", value);
  return response;
}

const authHandler = auth((req: AuthRequest, event: NextFetchEvent) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user?.role as Role) ?? null;

  let response = NextResponse.next();

  if (isPublicRoute(pathname)) {
    response = addCspHeaders(req, response);
    return response;
  }

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    response = NextResponse.redirect(loginUrl);
    response = addCspHeaders(req, response);
    return response;
  }

  if (matchesRoutes(pathname, adminRoutes) && role !== "ADMIN") {
    response = NextResponse.redirect(new URL("/", req.url));
    response = addCspHeaders(req, response);
    return response;
  }

  if (matchesRoutes(pathname, sellerRoutes) && role !== "SELLER" && role !== "ADMIN") {
    response = NextResponse.redirect(new URL("/", req.url));
    response = addCspHeaders(req, response);
    return response;
  }

  if (matchesRoutes(pathname, customerRoutes) && role === "ADMIN") {
    response = NextResponse.next();
    response = addCspHeaders(req, response);
    return response;
  }

  response = addCspHeaders(req, response);
  return response;
});

export default authHandler;

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
