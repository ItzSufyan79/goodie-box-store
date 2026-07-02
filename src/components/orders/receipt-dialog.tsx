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
  discount: number;
  couponCode: string | null;
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
  discount,
  couponCode,
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
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const deliveryLabel = deliveryOption ? (deliveryLabels[deliveryOption] ?? deliveryOption) : "";
    const scheduledDate = deliveryDate
      ? new Date(deliveryDate).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const rows = items
      .map(
        (i) =>
          `<tr><td style="padding:4px 0">${escapeHtml(i.title)} x${i.quantity}</td><td style="padding:4px 0;text-align:right">₹${(i.price * i.quantity).toFixed(2)}</td></tr>`
      )
      .join("");

    let detailsHtml = "";
    if (deliveryOption || resinRelated !== undefined || giftOption) {
      detailsHtml = `<div style="background:#f5f5f5;border-radius:8px;padding:12px;margin:16px 0;font-size:13px">`;
      if (deliveryOption) detailsHtml += `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:#666">Delivery</span><strong>${escapeHtml(deliveryLabel)}</strong></div>`;
      if (deliveryDate) detailsHtml += `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:#666">Scheduled</span><strong>${escapeHtml(scheduledDate)}</strong></div>`;
      if (resinRelated !== undefined) detailsHtml += `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:#666">Resin order</span><strong>${resinRelated ? "Yes" : "No"}</strong></div>`;
      if (giftOption) detailsHtml += `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:#666">Gift order</span><strong>Yes</strong></div>`;
      if (giftMessage) detailsHtml += `<div style="margin-top:4px"><span style="color:#666;font-size:11px">Gift message:</span><p style="font-style:italic;font-size:11px;margin:2px 0 0">&ldquo;${escapeHtml(giftMessage)}&rdquo;</p></div>`;
      detailsHtml += `</div>`;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${escapeHtml(orderNumber)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; color: #000; }
            table { width: 100%; border-collapse: collapse; }
            hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div style="text-align:center;margin-bottom:16px">
            <div style="font-weight:bold;font-size:18px">Goodie Box Store</div>
            <div style="font-size:13px;color:#666">Order #${escapeHtml(orderNumber)}</div>
            <div style="font-size:11px;color:#666">Payment ID: ${escapeHtml(paymentId ?? "—")}</div>
          </div>
          <hr/>
          ${detailsHtml}
          <div style="margin:16px 0">
            <div style="font-size:13px;color:#666;margin-bottom:8px">Items</div>
            <table>${rows}</table>
          </div>
          <hr/>
          <div style="font-size:13px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#666">Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#666">Shipping</span><span>₹${shipping.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#666">Tax</span><span>₹${tax.toFixed(2)}</span></div>
            <hr/>
            <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:16px"><span>Total</span><span>₹${total.toFixed(2)}</span></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  function escapeHtml(str: string) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

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
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="text-muted-foreground">Discount{couponCode ? ` (${couponCode})` : ""}</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
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
