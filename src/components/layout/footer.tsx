import Link from "next/link";
import { Gift, Mail, Phone, MapPin, Clock, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { NewsletterForm } from "@/components/layout/newsletter-form";

const linkClass =
  "group relative inline-flex items-center before:absolute before:bottom-0 before:left-0 before:h-[0.05em] before:w-full before:bg-current before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] hover:before:origin-left hover:before:scale-x-100";

const footerLinks = {
  shop: [
    { label: "All Products", href: "/products" },
    { label: "Custom Requests", href: "/custom-request" },
  ],
  help: [
    { label: "Track Order", href: "/orders" },
    { label: "FAQ", href: "/faq" },
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
            <div className="space-y-2 text-sm">
              <a
                href="mailto:goodieboxstore27@gmail.com"
                className={`${linkClass} flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors`}
              >
                <Mail className="h-4 w-4 shrink-0" />
                goodieboxstore27@gmail.com
              </a>
              <a
                href="tel:+918320895174"
                className={`${linkClass} flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors`}
              >
                <Phone className="h-4 w-4 shrink-0" />
                +91 8320895174
              </a>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                Juhapura, Ahmedabad, Gujarat 380055
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                Online orders 24/7
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <a
                href="https://instagram.com/goodieboxstore.27"
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkClass} flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors`}
              >
                <ExternalLink className="h-4 w-4" />
                Instagram
              </a>
              <a
                href="mailto:goodieboxstore27@gmail.com"
                className={`${linkClass} flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors`}
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-muted/50">
              <NewsletterForm />
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
                      className={`${linkClass} text-sm text-muted-foreground hover:text-primary transition-colors`}
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
            <Link href="/privacy" className={`${linkClass} hover:text-primary`}>Privacy</Link>
            <Link href="/terms" className={`${linkClass} hover:text-primary`}>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
