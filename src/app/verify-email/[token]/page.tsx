"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { verifyEmailAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { token } = await params;
      const result = await verifyEmailAction(token);
      if (result.success) {
        setState("success");
        setMessage("Email verified successfully!");
      } else {
        setState("error");
        setMessage(result.error ?? "Invalid or expired verification link.");
      }
    })();
  }, [params]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-md text-center">
      <Card>
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {state === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          )}
          {state === "success" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <p className="text-muted-foreground">{message}</p>
              <Button asChild><Link href="/login">Sign In</Link></Button>
            </div>
          )}
          {state === "error" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-muted-foreground">{message}</p>
              <Button asChild variant="outline"><Link href="/">Go Home</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
