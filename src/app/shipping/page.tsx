import { Truck, Package, Clock, ShieldCheck } from "lucide-react";

export default function ShippingPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Shipping Information</h1>

      <div className="space-y-8">
        <div className="flex gap-4">
          <Truck className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Delivery Timeline</h2>
            <p className="text-muted-foreground">
              Orders are processed within 1-2 business days. Standard delivery takes
              3-7 business days depending on your location. Express shipping is
              available at an additional cost.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Package className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Shipping Charges</h2>
            <p className="text-muted-foreground">
              Free shipping on all orders above ₹999. A flat rate of ₹49 is
              applied to orders below ₹999.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Clock className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Order Tracking</h2>
            <p className="text-muted-foreground">
              Once your order is shipped, you will receive a tracking number via
              email. You can track your order on our{" "}
              <a href="/orders" className="text-primary hover:underline">
                Orders page
              </a>
              .
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Shipping Locations</h2>
            <p className="text-muted-foreground">
              We currently ship across India. International shipping is not
              available at this time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
