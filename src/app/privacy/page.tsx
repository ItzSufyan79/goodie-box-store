import { FadeIn } from "@/components/animations/fade-in";
import { Gift } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "Goodie Box Store privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <FadeIn>
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-5 w-5 text-primary" />
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Goodie Box
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 29, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <Section title="1. Information We Collect">
            <p>We collect information you provide directly, such as when you create an account, place an order, or contact us. This includes your name, email address, phone number, shipping address, and payment details.</p>
            <p>We also automatically collect certain information when you visit our site, including your IP address, browser type, device information, and browsing behavior through cookies and similar technologies.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders and account</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Improve our products and services</li>
              <li>Detect and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="3. Payment Processing">
            <p>We use third-party payment processors (Razorpay, Stripe) to handle payments. Your payment details are securely processed by these providers and are not stored on our servers. We only retain order history and transaction references.</p>
          </Section>

          <Section title="4. Data Sharing">
            <p>We do not sell your personal information. We may share your data with trusted third parties who assist us in operating our store, such as:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Shipping partners (to deliver your orders)</li>
              <li>Payment processors (to process transactions)</li>
              <li>Analytics providers (to understand site usage)</li>
            </ul>
          </Section>

          <Section title="5. Data Retention">
            <p>We retain your personal information for as long as your account is active or as needed to provide you services. You can request deletion of your account and associated data at any time by contacting us.</p>
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Object to processing of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </Section>

          <Section title="7. Cookies">
            <p>We use essential cookies for site functionality and analytics cookies to understand how you use our site. You can control cookie preferences through your browser settings. Disabling certain cookies may affect site functionality.</p>
          </Section>

          <Section title="8. Contact Us">
            <p>If you have questions about this privacy policy, please contact us at <a href="mailto:goodieboxstore27@gmail.com" className="text-primary hover:underline">goodieboxstore27@gmail.com</a> or call <a href="tel:+918320895174" className="text-primary hover:underline">+91 8320895174</a>.</p>
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
