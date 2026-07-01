import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NavbarWrapper } from "@/components/layout/navbar-wrapper";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { ToastProvider } from "@/hooks/use-toast";
import { RealtimeNotifications } from "@/components/realtime/notifications";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { ScrollProgress } from "@/components/animations/scroll-progress";
import { PageTransition } from "@/components/layout/page-transition";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "GoodieBox | Curated with Love",
    template: "%s | GoodieBox",
  },
  description:
    "Shop curated gift boxes, college essentials, snacks, and custom product requests. Your one-stop destination for thoughtful gifting.",
  keywords: ["gift boxes", "college essentials", "snacks", "curated gifts", "gifting", "goodie box"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GoodieBox",
  },
  openGraph: {
    title: "Goodie Box Store",
    description: "Shop curated gift boxes, college essentials, snacks, and custom product requests.",
    url: baseUrl,
    siteName: "Goodie Box Store",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Goodie Box Store",
    description: "Shop curated gift boxes, college essentials, snacks, and custom product requests.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e91e8c" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f1a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem("gbs-theme");
                  if (t === "dark" || (t !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
                    document.documentElement.classList.add("dark");
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SkipToContent />
        <ScrollProgress />
        <Providers>
          <ToastProvider>
            <RealtimeNotifications />
            <NavbarWrapper />
            <main id="main-content" className="flex-1" tabIndex={-1}>
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
