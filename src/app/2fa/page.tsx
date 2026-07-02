"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Smartphone } from "lucide-react";

export default function TwoFactorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("sessionToken");
  const email = searchParams.get("email");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handle2FA = () => {
    if (!sessionToken) {
      setError("Missing session. Please sign in again.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        // Get challenge from session
        const challengeRes = await fetch(`/api/auth/2fa/challenge?token=${sessionToken}`);
        const challengeData = await challengeRes.json();
        if (challengeData.error) {
          setError(challengeData.error);
          return;
        }

        // Complete WebAuthn challenge
        const authResponse = await startAuthentication(challengeData.challenge);

        const completeRes = await fetch("/api/auth/2fa/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken,
            response: authResponse,
          }),
        });
        const completeData = await completeRes.json();
        if (completeData.error) {
          setError(completeData.error);
          return;
        }

        // Sign in with auth token
        const result = await signIn("credentials", {
          email: email ?? "",
          password: "",
          authToken: completeData.authToken,
          redirect: false,
        });

        if (result?.error) {
          setError("Authentication failed. Please try again.");
        } else {
          router.push("/");
          router.refresh();
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Smartphone className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <p className="text-sm text-muted-foreground">
            Verify your identity with your passkey
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg w-full">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button
            className="w-full"
            onClick={handle2FA}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify with Passkey"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
