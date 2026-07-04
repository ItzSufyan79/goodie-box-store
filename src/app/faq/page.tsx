import { FadeIn } from "@/components/animations/fade-in";
import { Gift, ChevronDown } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Frequently Asked Questions | GoodieBox Store",
  description:
    "Answers to common questions about ordering, shipping, returns, payments, and custom requests at GoodieBox Store.",
};

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <FadeIn>
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-5 w-5 text-primary" />
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Goodie Box
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground mb-10">
          Everything you need to know about shopping at GoodieBox.
        </p>

        <div className="space-y-4">
          <FaqItem
            question="How do I place an order?"
            answer="Simply browse our products, add items to your cart, and proceed to checkout. You'll need to create an account or sign in. Choose your delivery option, enter your address, and complete payment via Razorpay (cards/UPI/net banking) or Cash on Delivery."
          />
          <FaqItem
            question="What payment methods do you accept?"
            answer="We accept all major credit/debit cards, UPI (Google Pay, PhonePe, Paytm), net banking via Razorpay, and Cash on Delivery (COD) for eligible pincodes. All payments are processed securely."
          />
          <FaqItem
            question="How long does delivery take?"
            answer="We offer three delivery options: Urgent (1-2 business days, ₹99), Standard (3-4 business days, ₹49, free on orders ₹1,499+), and Flexible (choose your preferred date, ₹149)."
          />
          <FaqItem
            question="Do you ship outside Ahmedabad?"
            answer="Yes! We ship across India. Delivery times vary by location. You can check serviceability for your pincode during checkout."
          />
          <FaqItem
            question="What is your return policy?"
            answer="We accept returns within 7 days of delivery for eligible items. Items must be unused and in original packaging. Custom/personalized items are non-returnable. Contact us at goodieboxstore27@gmail.com to initiate a return."
          />
          <FaqItem
            question="How do I track my order?"
            answer="Once your order is shipped, you'll receive a tracking number via email. You can also view real-time order status on your Orders page. We'll send email updates at every stage — Processing, Shipped, and Delivered."
          />
          <FaqItem
            question="Can I make changes to my order after placing it?"
            answer="Please contact us as soon as possible at goodieboxstore27@gmail.com or via WhatsApp. We'll try to accommodate changes, but once an order enters processing, modifications may not be possible."
          />
          <FaqItem
            question="What are custom requests?"
            answer="Looking for something specific? Use our Custom Request feature to tell us what you need. We'll review it, provide a quote, and create it just for you! Visit the Custom Request page to get started."
          />
          <FaqItem
            question="How does Cash on Delivery work?"
            answer="Select COD at checkout. Pay cash to the delivery partner when your order arrives. COD availability depends on your pincode and order value."
          />
          <FaqItem
            question="Is my payment information secure?"
            answer="Absolutely. All payments are processed through Razorpay, a PCI-DSS compliant payment gateway. We never store your card or UPI details on our servers."
          />
        </div>
      </FadeIn>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border rounded-xl [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex items-center justify-between p-4 cursor-pointer">
        <span className="font-medium text-sm">{question}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </details>
  );
}
