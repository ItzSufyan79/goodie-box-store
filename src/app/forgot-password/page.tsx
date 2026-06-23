"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    if (!email) { setError("Enter your email"); return; }

    startTransition(async () => {
      const result = await forgotPasswordAction(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  };

  if (sent) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
        <p className="text-muted-foreground mb-6">
          If an account exists with that email, we&apos;ve sent a reset link.
        </p>
        <Button variant="outline" asChild>
          <Link href="/login">Back to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/login"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required className="mt-1" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
