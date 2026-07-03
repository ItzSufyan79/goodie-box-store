import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Your Email | GoodieBox Store",
  description: "Please check your email for the next step.",
};

export default function CheckEmailPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md text-center">
      <Card>
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Mail className="h-12 w-12 text-primary" />
          <p className="text-muted-foreground">
            We sent a verification link to your email. Click the link to activate your account before signing in.
          </p>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t get the email? Check your spam folder or{" "}
            <Link href="/resend-verification" className="text-primary hover:underline">
              resend verification
            </Link>
          </p>
          <Button asChild variant="outline">
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
