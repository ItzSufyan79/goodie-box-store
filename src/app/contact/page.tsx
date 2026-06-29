import { Mail, Phone, MapPin, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
      <p className="text-muted-foreground mb-8">
        Have a question? We&apos;d love to hear from you.
      </p>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6">
          <Mail className="h-6 w-6 text-primary mb-3" />
          <h2 className="font-semibold mb-1">Email</h2>
          <a
            href="mailto:goodieboxstore27@gmail.com"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            goodieboxstore27@gmail.com
          </a>
          <p className="text-xs text-muted-foreground mt-1">
            We reply within 24 hours
          </p>
        </div>

        <div className="border rounded-xl p-6">
          <Phone className="h-6 w-6 text-primary mb-3" />
          <h2 className="font-semibold mb-1">Phone</h2>
          <a
            href="tel:+918320895174"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            +91 8320895174
          </a>
        </div>

        <div className="border rounded-xl p-6">
          <MapPin className="h-6 w-6 text-primary mb-3" />
          <h2 className="font-semibold mb-1">Address</h2>
          <p className="text-muted-foreground">
            Juhapura, Ahmedabad
            <br />
            Gujarat 380055
          </p>
        </div>

        <div className="border rounded-xl p-6">
          <Clock className="h-6 w-6 text-primary mb-3" />
          <h2 className="font-semibold mb-1">Business Hours</h2>
          <p className="text-muted-foreground">Online orders 24/7</p>
        </div>
      </div>

      <div className="mt-8 border rounded-xl p-6">
        <h2 className="font-semibold mb-3">Follow Us</h2>
        <a
          href="https://instagram.com/goodieboxstore27"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          @goodieboxstore27 on Instagram
        </a>
      </div>
    </div>
  );
}
