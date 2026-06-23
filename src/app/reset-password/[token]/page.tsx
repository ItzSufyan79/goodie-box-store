"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirm = form.get("confirmPassword") as string;

    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    const { token } = await params;

    startTransition(async () => {
      const result = await resetPasswordAction(token, password);
      if (result.error) {
        setError(result.error);
      } else {
        setDone(true);
      }
    });
  };

  if (done) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Password Reset</h1>
        <p className="text-muted-foreground mb-6">Your password has been reset successfully.</p>
        <Button asChild><Link href="/login">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Set New Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required className="mt-1" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
