import type { Metadata } from "next";
import { ShieldCheck, RotateCcw, Clock, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Returns & Refunds | GoodieBox Store",
  description: "Our 7-day money-back guarantee and return policy.",
};

export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-10">
        <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Returns & Refunds</h1>
        <p className="text-muted-foreground">
          We stand behind every product. If you&apos;re not happy, we&apos;ll make it right.
        </p>
      </div>

      <div className="space-y-8">
        <section className="border rounded-xl p-6 bg-card">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            7-Day Money-Back Guarantee
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you&apos;re not completely satisfied with your purchase, you can request a
            return within <strong>7 days</strong> of delivery. Once we receive the item back,
            we&apos;ll process your refund within 5-7 business days.
          </p>
        </section>

        <section className="border rounded-xl p-6 bg-card">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <RotateCcw className="h-5 w-5 text-primary" />
            How to Return
          </h2>
          <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
            <li>Go to your order in <strong>My Orders</strong> and click <strong>Request Return</strong>.</li>
            <li>Tell us why you&apos;re returning the item.</li>
            <li>We&apos;ll review your request and get back to you within 2 business days.</li>
            <li>If approved, we&apos;ll arrange pickup or provide a return address.</li>
            <li>Once we receive the item, your refund is processed within 5-7 business days.</li>
          </ol>
        </section>

        <section className="border rounded-xl p-6 bg-card">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-primary" />
            Refund Timeline
          </h2>
          <div className="text-sm text-muted-foreground space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span>Return request approved</span>
              <span className="font-medium">Within 2 business days</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span>Item picked up / received</span>
              <span className="font-medium">3-5 business days</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Refund processed</span>
              <span className="font-medium">5-7 business days after receipt</span>
            </div>
          </div>
        </section>

        <section className="border rounded-xl p-6 bg-card">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            Conditions
          </h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Items must be unused and in original packaging.</li>
            <li>Custom/personalized products are not eligible for return unless defective.</li>
            <li>Shipping charges are non-refundable.</li>
            <li>Return shipping is covered by us for defective/damaged items.</li>
            <li>Refunds are issued to the original payment method.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
