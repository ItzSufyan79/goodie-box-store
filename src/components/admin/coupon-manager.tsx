"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Power, PowerOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createCouponAction, toggleCouponAction, deleteCouponAction } from "@/actions/coupons";
import { formatPrice } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: Date;
}

interface CouponManagerProps {
  coupons: Coupon[];
}

export function CouponManager({ coupons }: CouponManagerProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      await createCouponAction({
        code: form.get("code") as string,
        description: form.get("description") as string,
        discountPercent: form.get("discountPercent") ? Number(form.get("discountPercent")) : undefined,
        discountAmount: form.get("discountAmount") ? Number(form.get("discountAmount")) : undefined,
        minOrderAmount: Number(form.get("minOrderAmount")) || 0,
        maxDiscountAmount: form.get("maxDiscountAmount") ? Number(form.get("maxDiscountAmount")) : undefined,
        maxUses: Number(form.get("maxUses")) || 0,
        expiresAt: form.get("expiresAt") as string,
      });
      setShowForm(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              New Coupon
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Coupon</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" required placeholder="SAVE20" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="20% off on all items" />
              </div>
              <div>
                <Label htmlFor="discountPercent">Discount %</Label>
                <Input id="discountPercent" name="discountPercent" type="number" min="0" max="100" />
              </div>
              <div>
                <Label htmlFor="discountAmount">Fixed Amount (₹)</Label>
                <Input id="discountAmount" name="discountAmount" type="number" min="0" />
              </div>
              <div>
                <Label htmlFor="minOrderAmount">Min Order (₹)</Label>
                <Input id="minOrderAmount" name="minOrderAmount" type="number" min="0" defaultValue="0" />
              </div>
              <div>
                <Label htmlFor="maxDiscountAmount">Max Discount (₹)</Label>
                <Input id="maxDiscountAmount" name="maxDiscountAmount" type="number" min="0" />
              </div>
              <div>
                <Label htmlFor="maxUses">Max Uses (0 = unlimited)</Label>
                <Input id="maxUses" name="maxUses" type="number" min="0" defaultValue="0" />
              </div>
              <div>
                <Label htmlFor="expiresAt">Expires At</Label>
                <Input id="expiresAt" name="expiresAt" type="datetime-local" />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isPending} className="w-full">Create</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {coupons.length === 0 && (
          <p className="text-muted-foreground text-center py-12">No coupons created yet.</p>
        )}
        {coupons.map((coupon) => (
          <Card key={coupon.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg">{coupon.code}</span>
                  <Badge variant={coupon.isActive ? "success" : "secondary"}>
                    {coupon.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {coupon.description && (
                  <p className="text-sm text-muted-foreground">{coupon.description}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {coupon.discountPercent && <span>{coupon.discountPercent}% off</span>}
                  {coupon.discountAmount && <span>₹{Number(coupon.discountAmount).toFixed(2)} off</span>}
                  <span>Min: {formatPrice(Number(coupon.minOrderAmount))}</span>
                  {coupon.maxDiscountAmount && <span>Max: {formatPrice(Number(coupon.maxDiscountAmount))}</span>}
                  {coupon.maxUses > 0 && <span>Uses: {coupon.usedCount}/{coupon.maxUses}</span>}
                  {coupon.expiresAt && (
                    <span>Expires: {new Date(coupon.expiresAt).toLocaleDateString("en-IN")}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    startTransition(async () => {
                      await toggleCouponAction(coupon.id, !coupon.isActive);
                      router.refresh();
                    });
                  }}
                  disabled={isPending}
                >
                  {coupon.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`Delete coupon "${coupon.code}"?`)) {
                      startTransition(async () => {
                        await deleteCouponAction(coupon.id);
                        router.refresh();
                      });
                    }
                  }}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
