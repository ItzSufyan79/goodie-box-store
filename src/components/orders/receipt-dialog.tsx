"use client";

import { useState, useRef } from "react";
import { Receipt, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

interface ReceiptItem {
  title: string;
  quantity: number;
  price: number;
}

interface ReceiptDialogProps {
  orderNumber: string;
  paymentId: string | null;
  items: ReceiptItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  deliveryOption?: string | null;
  deliveryDate?: string | null;
  resinRelated?: boolean | null;
  giftOption?: boolean | null;
  giftMessage?: string | null;
}

const deliveryLabels: Record<string, string> = {
  URGENT: "Urgent (1–2 days)",
  STANDARD: "Standard (3–4 days)",
  FLEXIBLE: "Flexible (customer's choice)",
};

export function ReceiptButton({
  orderNumber,
  paymentId,
  items,
  subtotal,
  shipping,
  tax,
  total,
  deliveryOption,
  deliveryDate,
  resinRelated,
  giftOption,
  giftMessage,
}: ReceiptDialogProps) {
  const [open, setOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current?.cloneNode(true) as HTMLElement;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; color: #000; }
            .text-center { text-align: center; }
            .text-muted { color: #666; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 18px; }
            .text-sm { font-size: 13px; }
            .text-xs { font-size: 11px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mt-4 { margin-top: 16px; }
            .mt-6 { margin-top: 24px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
            .border { border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #f9f9f9; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs gap-1"
        onClick={() => setOpen(true)}
      >
        <Receipt className="h-3 w-3" />
        Receipt
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">Receipt</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handlePrint}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div ref={receiptRef} className="p-4 space-y-4">
              <div className="text-center">
                <p className="font-bold text-lg">Goodie Box Store</p>
                <p className="text-sm text-muted-foreground">
                  Order #{orderNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  Payment ID: {paymentId ?? "—"}
                </p>
              </div>

              <Separator />

              {(deliveryOption || resinRelated || giftOption) && (
                <div className="space-y-1.5 text-sm bg-muted/50 rounded-lg p-3">
                  {deliveryOption && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-medium">
                        {deliveryLabels[deliveryOption] ?? deliveryOption}
                      </span>
                    </div>
                  )}
                  {deliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scheduled</span>
                      <span className="font-medium">
                        {new Date(deliveryDate).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {resinRelated !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resin order</span>
                      <span className="font-medium">
                        {resinRelated ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                  {giftOption && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gift order</span>
                      <span className="font-medium">Yes</span>
                    </div>
                  )}
                  {giftMessage && (
                    <div className="mt-1">
                      <span className="text-muted-foreground text-xs block">
                        Gift message:
                      </span>
                      <p className="italic text-xs mt-0.5">&ldquo;{giftMessage}&rdquo;</p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Items
                </p>
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="flex-1">
                      {item.title}{" "}
                      <span className="text-muted-foreground">
                        x{item.quantity}
                      </span>
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
