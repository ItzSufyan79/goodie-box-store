"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customRequestSchema,
} from "@/lib/validations";
import { createCustomRequestAction } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function CustomRequestPage() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customRequestSchema),
  });

  const onSubmit = (data: unknown) => {
    startTransition(async () => {
      const result = await createCustomRequestAction(data);
      if (result.success) {
        setSubmitted(data as Record<string, unknown>);
      }
    });
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Request Submitted!</h1>
          <p className="text-muted-foreground">
            We&apos;ll review your request and get back to you soon.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>What You Submitted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{submitted.name as string}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium">{submitted.phone as string}</p>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Title:</span>
              <p className="font-medium">{submitted.title as string}</p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Description:</span>
              <p className="font-medium">{submitted.description as string}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {!!submitted.budget && (
                <div>
                  <span className="text-muted-foreground">Budget:</span>
                  <p className="font-medium">{formatPrice(Number(submitted.budget))}</p>
                </div>
              )}
              {!!submitted.occasion && (
                <div>
                  <span className="text-muted-foreground">Occasion:</span>
                  <p className="font-medium">{submitted.occasion as string}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-4 justify-center mt-6">
          <Button asChild>
            <Link href="/my-requests">Track Your Requests</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Custom Gift Request</h1>
        <p className="text-muted-foreground">
          Tell us what you&apos;re looking for and we&apos;ll create a
          personalized gift box just for you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  {...register("name")}
                  className="mt-1"
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...register("phone")}
                  className="mt-1"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="title">What are you looking for?</Label>
              <Input
                id="title"
                placeholder="e.g., Birthday gift box for college friend"
                {...register("title")}
                className="mt-1"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Describe your requirements</Label>
              <textarea
                id="description"
                rows={5}
                placeholder="Include preferences, dietary restrictions, themes, etc."
                {...register("description")}
                className="mt-1 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget (optional)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="₹ Amount"
                  {...register("budget")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="occasion">Occasion (optional)</Label>
                <Input
                  id="occasion"
                  placeholder="Birthday, Exam, etc."
                  {...register("occasion")}
                  className="mt-1"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
