"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { resendVerificationAction } from "@/actions/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/animations/fade-in";

const emailSchema = z.object({ email: z.string().email("Invalid email address") });

export default function ResendVerificationPage() {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = (data: { email: string }) => {
    startTransition(async () => {
      await resendVerificationAction(data.email);
      setSent(true);
    });
  };

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <FadeIn>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Resend Verification</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a new verification link
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <p className="text-muted-foreground">
                If an account with that email exists, a verification link has been sent.
              </p>
              <Button asChild variant="outline">
                <Link href="/login">Go to Sign In</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} className="mt-1" />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Sending..." : "Send Verification"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      </FadeIn>
    </div>
  );
}
