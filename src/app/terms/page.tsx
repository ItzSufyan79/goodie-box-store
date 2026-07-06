import { FadeIn } from "@/components/animations/fade-in";
import { Gift } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions",
  description: "Goodie Box Store terms and conditions — rules and guidelines for using our service.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <FadeIn>
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-5 w-5 text-primary" />
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Goodie Box
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 29, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using Goodie Box Store, you agree to be bound by these terms. If you do not agree, please do not use our services. We reserve the right to update these terms at any time, and continued use constitutes acceptance of changes.</p>
          </Section>

          <Section title="2. Account Registration">
            <p>You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. Notify us immediately of any unauthorized use.</p>
          </Section>

          <Section title="3. Orders & Payment">
            <p>All orders are subject to availability and acceptance. We reserve the right to cancel any order for reasons including but not limited to: product unavailability, pricing errors, or suspected fraud.</p>
            <p>Prices are listed in Indian Rupees (₹) and inclusive of applicable taxes. Payment is due at the time of ordering.</p>
          </Section>

          <Section title="4. Shipping & Delivery">
            <p>We ship across India. Delivery times are estimates and not guaranteed. Free shipping applies to orders over ₹1,499. Risk of loss passes to you upon delivery. For shipping details, see our <Link href="/shipping" className="text-primary hover:underline">Shipping Policy</Link>.</p>
          </Section>

          <Section title="5. Returns & Refunds">
            <p>We accept returns within 7 days of delivery for eligible items. Items must be unused and in original packaging. Custom/personalized items are non-returnable. For full details, see our <Link href="/returns" className="text-primary hover:underline">Return Policy</Link>.</p>
          </Section>

          <Section title="6. Custom Requests">
            <p>Custom requests are reviewed individually. We reserve the right to accept or decline any custom request. Quoted prices are valid for 7 days. Payment is required before production begins on custom orders.</p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>All content on this site — including product images, descriptions, logos, and design — is owned by Goodie Box Store or our licensors. You may not reproduce, distribute, or create derivative works without our written consent.</p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>Goodie Box Store shall not be liable for any indirect, incidental, or consequential damages arising from your use of our service. Our total liability is limited to the amount paid for the product giving rise to the claim.</p>
          </Section>

          <Section title="9. Governing Law">
            <p>These terms are governed by the laws of India. Any disputes shall be resolved in the courts of Ahmedabad, Gujarat.</p>
          </Section>

          <Section title="10. Contact">
            <p>For questions about these terms, contact us at <a href="mailto:goodieboxstore27@gmail.com" className="text-primary hover:underline">goodieboxstore27@gmail.com</a> or call <a href="tel:+918320895174" className="text-primary hover:underline">+91 8320895174</a>.</p>
          </Section>
        </div>
      </FadeIn>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
