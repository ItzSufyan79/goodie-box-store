import { RotateCcw, AlertCircle, MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Refunds | GoodieBox Store",
  description: "Our return and refund policy.",
};

export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Returns & Exchanges</h1>

      <div className="space-y-8">
        <div className="flex gap-4">
          <RotateCcw className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Return Policy</h2>
            <p className="text-muted-foreground">
              We accept returns within 7 days of delivery. Items must be unused
              and in their original packaging. Customized and perishable items
              are non-returnable.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <AlertCircle className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Damaged or Incorrect Items</h2>
            <p className="text-muted-foreground">
              If you receive a damaged or incorrect item, please contact us
              within 48 hours of delivery with photos of the item and packaging.
              We will arrange a replacement or refund at no extra cost.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <MessageSquare className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">How to Initiate a Return</h2>
            <p className="text-muted-foreground">
              To start a return, please email us at goodieboxstore27@gmail.com
              with your order number and reason for return. Our team will guide
              you through the process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
