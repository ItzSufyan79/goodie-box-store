import Link from "next/link";
import { Gift, Share2, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  shop: [
    { label: "All Products", href: "/products" },
    { label: "Custom Requests", href: "/custom-request" },
  ],
  help: [
    { label: "Track Order", href: "/orders" },
    { label: "Shipping Info", href: "/shipping" },
    { label: "Returns", href: "/returns" },
    { label: "Contact Us", href: "/contact" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Gift Guides", href: "/collections" },
    { label: "Blog", href: "/blog" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Gift className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">
                Goodie<span className="text-primary">Box</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Curated gift boxes, college essentials, and snacks delivered with
              love. Your one-stop shop for thoughtful gifting.
            </p>
            <div className="flex gap-3">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Share2 className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold mb-4 capitalize">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Goodie Box Store. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
            <Link href="/terms" className="hover:text-primary">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
