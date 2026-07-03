"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  checkoutSchema,
  type CheckoutFormValues,
  type CheckoutInput,
} from "@/lib/validations";
import { createOrderAction, confirmPaymentAction, getShippingRateAction } from "@/actions/orders";
import { validateCouponAction } from "@/actions/coupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayPaymentOrder {
  provider: "razorpay";
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
  name: string;
  description: string;
  prefill?: {
    email?: string;
    name?: string;
  };
}

function loadRazorpayCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const DELIVERY_OPTIONS = [
  { value: "URGENT", label: "Urgent (1–2 days)", price: 99 },
  { value: "STANDARD", label: "Standard (3–4 days)", price: 49 },
  { value: "FLEXIBLE", label: "Flexible (choose date & time)", price: 149 },
] as const;

function getShippingCost(deliveryOption: string | undefined, subtotal: number) {
  if (!deliveryOption) return subtotal >= 1499 ? 0 : 59;
  if (deliveryOption === "STANDARD" && subtotal >= 1499) return 0;
  return DELIVERY_OPTIONS.find((o) => o.value === deliveryOption)?.price ?? 59;
}

interface CheckoutFormProps {
  subtotal: number;
}

export function CheckoutForm({ subtotal }: CheckoutFormProps) {
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues, unknown, CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentProvider: "RAZORPAY" as const,
      address: { country: "IN", label: "Home" },
      deliveryOption: undefined,
      resinRelated: false,
      giftOption: false,
      giftMessage: "",
      deliveryDate: "",
      couponCode: "",
    },
  });

  const deliveryOption = useWatch({ control, name: "deliveryOption" }) as string | undefined;
  const resinRelated = useWatch({ control, name: "resinRelated" });
  const giftOption = useWatch({ control, name: "giftOption" });

  const isResinRelated = resinRelated === true || resinRelated === "true";
  const isGift = giftOption === true || giftOption === "true";

  const availableDeliveryOptions = useMemo(
    () => DELIVERY_OPTIONS.filter((o) => !isResinRelated || o.value !== "URGENT"),
    [isResinRelated]
  );

  const [shippingInfo, setShippingInfo] = useState<{
    loading: boolean;
    message: string;
    charge: number | null;
  }>({ loading: false, message: "", charge: null });

  const [couponState, setCouponState] = useState<{
    code: string;
    discount: number;
    valid: boolean;
    message: string;
    loading: boolean;
  }>({ code: "", discount: 0, valid: false, message: "", loading: false });

  const pincode = useWatch({ control, name: "address.postalCode" }) as string | undefined;

  useEffect(() => {
    let cancelled = false;
    if (!pincode || pincode.length < 6) {
      setShippingInfo({ loading: false, message: "", charge: null });
      return;
    }
    const timer = setTimeout(async () => {
      setShippingInfo({ loading: true, message: "Checking shipping...", charge: null });
      try {
        const result = await getShippingRateAction(pincode, subtotal);
        if (cancelled) return;
        if (!result.serviceable) {
          setShippingInfo({ loading: false, message: result.message, charge: null });
          return;
        }
        setShippingInfo({
          loading: false,
          message: result.message,
          charge: result.charge,
        });
      } catch {
        if (!cancelled) setShippingInfo({ loading: false, message: "", charge: null });
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [pincode, subtotal]);

  const applyCoupon = async () => {
    const code = couponState.code.trim();
    if (!code || couponState.loading) return;
    setCouponState((prev) => ({ ...prev, loading: true, message: "" }));
    const result = await validateCouponAction(code, subtotal);
    if (result.valid) {
      setCouponState((prev) => {
        const discount = result.discount!;
        return {
          ...prev,
          discount,
          valid: true,
          message: `Coupon applied! You save ₹${discount.toLocaleString("en-IN")}`,
          loading: false,
        };
      });
      setValue("couponCode", code);
    } else {
      setCouponState((prev) => {
        const message = result.message ?? "";
        return {
          ...prev,
          discount: 0,
          valid: false,
          message,
          loading: false,
        };
      });
      setValue("couponCode", "");
    }
  };

  const effectiveSubtotal = subtotal;
  const discount = couponState.discount;
  const shipping = useMemo(() => getShippingCost(deliveryOption, effectiveSubtotal - discount), [deliveryOption, effectiveSubtotal, discount]);
  const tax = useMemo(() => Math.round((effectiveSubtotal - discount) * 0.05), [effectiveSubtotal, discount]);
  const total = useMemo(() => effectiveSubtotal - discount + shipping + tax, [effectiveSubtotal, discount, shipping, tax]);

  const validateAddressStep = async () => {
    setFormError("");
    const fields = [
      "address.fullName",
      "address.phone",
      "address.postalCode",
      "address.line1",
      "address.city",
      "address.state",
      "deliveryOption",
    ];
    const isValid = await trigger(fields as FieldPath<CheckoutInput>[], { shouldFocus: true });

    if (!isValid) {
      setFormError("Complete the highlighted fields before continuing.");
      return;
    }

    setStep(2);
  };

  const onInvalid = () => {
    setFormError("Some checkout details are missing. Go back and complete the highlighted fields.");
  };

  const onSubmit = async (data: CheckoutInput) => {
    setFormError("");
    setIsProcessing(true);
    setProcessingMessage("Creating your order...");

    try {
      const result = await createOrderAction(data);
      if (result.error) {
        const rootError = "root" in result.error ? result.error.root?.[0] : undefined;
        setFormError(rootError ?? "Could not create your order.");
        setIsProcessing(false);
        setProcessingMessage("");
        return;
      }
      if (result.success && result.order) {
        if (result.payment?.provider === "razorpay") {
          const payment = result.payment as RazorpayPaymentOrder;
          setProcessingMessage("Opening Razorpay Checkout...");
          const loaded = await loadRazorpayCheckout();
          if (!loaded || !window.Razorpay) {
            setFormError("Could not load Razorpay Checkout. Check your connection and try again.");
            setIsProcessing(false);
            setProcessingMessage("");
            return;
          }

          const checkout = new window.Razorpay({
            key: payment.key,
            amount: payment.amount,
            currency: payment.currency,
            name: payment.name,
            description: payment.description,
            order_id: payment.razorpayOrderId,
            prefill: {
              ...payment.prefill,
              contact: data.address.phone,
            },
            theme: { color: "#e91e8c" },
            modal: {
              ondismiss: () => {
                setFormError("Payment was cancelled. Your order is pending payment.");
                setIsProcessing(false);
                setProcessingMessage("");
              },
            },
            handler: async (response) => {
              setIsProcessing(true);
              setProcessingMessage("Verifying payment...");
              const paymentResult = await confirmPaymentAction(result.order.id, {
                provider: "razorpay",
                razorpayOrderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });

              if (paymentResult.success) {
                setIsProcessing(false);
                setProcessingMessage("");
                setStep(4);
                return;
              }

              setFormError(paymentResult.error ?? "Payment verification failed.");
              setIsProcessing(false);
              setProcessingMessage("");
            },
          });

          checkout.open();
          return;
        }

        const paymentResult = await confirmPaymentAction(result.order.id, {
          provider: result.payment?.provider ?? "razorpay",
        });

        if (paymentResult.success) {
          setStep(4);
        } else {
          setFormError(paymentResult.error ?? "Payment verification failed.");
        }
      }
    } finally {
      if (step !== 4) {
        setIsProcessing(false);
        setProcessingMessage("");
      }
    }
  };

  if (step === 4) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
        <p className="text-muted-foreground mb-6">
          Thank you for your purchase. You&apos;ll receive updates on your order
          status.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push("/orders")}>View Orders</Button>
          <Button variant="outline" onClick={() => router.push("/products")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
      <div className="flex items-center gap-4 mb-8">
        {["Address & Options", "Payment", "Confirm"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i + 1
                  ? "bg-primary text-white"
                  : step === i + 1
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                step === i + 1 ? "font-medium" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < 2 && <div className="w-8 h-px bg-border hidden sm:block" />}
          </div>
        ))}
      </div>

      {formError && (
        <p className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      {...register("address.fullName")}
                      className="mt-1"
                    />
                    {errors.address?.fullName && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.address.fullName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      {...register("address.phone")}
                      className="mt-1"
                    />
                    {errors.address?.phone && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.address.phone.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      {...register("address.postalCode")}
                      className="mt-1"
                    />
                    {errors.address?.postalCode && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.address.postalCode.message}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="line1">Address Line 1</Label>
                    <Input
                      id="line1"
                      {...register("address.line1")}
                      className="mt-1"
                    />
                    {errors.address?.line1 && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.address.line1.message}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="line2">Address Line 2 (optional)</Label>
                    <Input
                      id="line2"
                      {...register("address.line2")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("address.city")} className="mt-1" />
                    {errors.address?.city && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.address.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      {...register("address.state")}
                      className="mt-1"
                    />
                    {errors.address?.state && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.address.state.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery & Customization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-sm font-medium block mb-3">
                      Is this order related to resin products?
                    </span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="false"
                          {...register("resinRelated")}
                          className="accent-primary"
                        />
                        <span className="text-sm">No</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="true"
                          {...register("resinRelated")}
                          className="accent-primary"
                        />
                        <span className="text-sm">Yes</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium block mb-3">
                      Delivery Speed
                    </span>
                    <div className="space-y-2">
                      {availableDeliveryOptions.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-primary ${
                            deliveryOption === opt.value ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            value={opt.value}
                            {...register("deliveryOption")}
                            className="accent-primary"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-sm">{opt.label}</span>
                          </div>
                          <span className="text-sm font-semibold">
                            {opt.value === "STANDARD" && subtotal >= 1499
                              ? "FREE"
                              : `₹${opt.price}`}
                          </span>
                        </label>
                      ))}
                    </div>
                    {errors.deliveryOption && (
                      <p className="text-sm text-destructive mt-1">
                        Select a delivery option
                      </p>
                    )}
                    {isResinRelated && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Urgent delivery is not available for resin-related orders.
                      </p>
                    )}
                  </div>

                  {deliveryOption === "FLEXIBLE" && (
                    <div>
                      <Label htmlFor="deliveryDate">Preferred Date & Time</Label>
                      <Input
                        id="deliveryDate"
                        type="datetime-local"
                        {...register("deliveryDate")}
                        className="mt-1"
                      />
                      {errors.deliveryDate && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.deliveryDate.message}
                        </p>
                      )}
                    </div>
                  )}

                  <Separator />

                  <div>
                    <span className="text-sm font-medium block mb-3">
                      Is this a gift for someone else?
                    </span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="false"
                          {...register("giftOption")}
                          className="accent-primary"
                        />
                        <span className="text-sm">No</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="true"
                          {...register("giftOption")}
                          className="accent-primary"
                        />
                        <span className="text-sm">Yes — add a message &amp; wrap</span>
                      </label>
                    </div>
                  </div>

                  {isGift && (
                    <>
                      <div>
                        <Label htmlFor="giftMessage">
                          Gift Message (optional)
                        </Label>
                        <textarea
                          id="giftMessage"
                          placeholder="Write a message for the recipient..."
                          {...register("giftMessage")}
                          className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          rows={3}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        Your box will be gift-wrapped with ribbon.
                      </p>
                    </>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button type="button" onClick={validateAddressStep}>
                      Continue to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { value: "COD", label: "Cash on Delivery (Pay at your doorstep)" },
                    { value: "RAZORPAY", label: "Razorpay (UPI, Cards, Net Banking)" },
                    { value: "STRIPE", label: "Stripe (International Cards)" },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-primary"
                    >
                      <input
                        type="radio"
                        value={method.value}
                        {...register("paymentProvider")}
                        className="accent-primary"
                      />
                      <span className="font-medium">{method.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(3)}>
                    Review Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Review your order details and click Place Order to complete
                  your purchase.
                </p>
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? processingMessage || "Processing..." : "Place Order"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>
                  {deliveryOption
                    ? shipping === 0
                      ? "FREE"
                      : formatPrice(shipping)
                    : "—"}
                </span>
              </div>
              {deliveryOption && (
                <p className="text-xs text-muted-foreground">
                  {DELIVERY_OPTIONS.find((o) => o.value === deliveryOption)?.label}
                </p>
              )}
              {shippingInfo.loading && (
                <p className="text-xs text-muted-foreground animate-pulse">
                  Checking shipping...
                </p>
              )}
              {shippingInfo.message && !shippingInfo.loading && (
                <p className="text-xs text-muted-foreground">
                  {shippingInfo.charge !== null
                    ? `₹${shippingInfo.charge}`
                    : shippingInfo.charge === null
                      ? shippingInfo.message
                      : ""} — {shippingInfo.message.replace(/₹\d+ /, "")}
                </p>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax (5% GST)</span>
                <span>{formatPrice(tax)}</span>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponState.code}
                    onChange={(e) => {
                      setCouponState((prev) => ({ ...prev, code: e.target.value, valid: false, message: "" }));
                      setValue("couponCode", "");
                    }}
                    className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyCoupon}
                    disabled={couponState.loading || !couponState.code.trim()}
                  >
                    {couponState.loading ? "..." : "Apply"}
                  </Button>
                </div>
                {couponState.message && (
                  <p className={`text-xs ${couponState.valid ? "text-emerald-600" : "text-destructive"}`}>
                    {couponState.message}
                  </p>
                )}
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
