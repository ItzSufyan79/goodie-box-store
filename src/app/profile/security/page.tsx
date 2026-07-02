"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Smartphone, ShieldCheck, Key } from "lucide-react";

interface Authenticator {
  id: string;
  credentialID: string;
}

export default function SecurityPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [authenticators, setAuthenticators] = useState<Authenticator[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch("/api/webauthn/authenticators").then((r) => r.json()),
      fetch("/api/auth/2fa/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user?.email }),
      }).then((r) => r.json()),
    ]).then(([authData, statusData]) => {
      setAuthenticators(authData.authenticators ?? []);
      setTwoFactorEnabled(statusData.twoFactorEnabled ?? false);
    }).finally(() => setLoading(false));
  }, [session]);

  const handleRegister = useCallback(async () => {
    setRegistering(true);
    setError("");
    try {
      const optionsRes = await fetch("/api/webauthn/register/options", { method: "POST" });
      const options = await optionsRes.json();
      if (options.error) { setError(options.error); return; }

      const regResponse = await startRegistration(options);

      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge: options.challenge, response: regResponse }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.error) { setError(verifyData.error); return; }

      // Refresh authenticator list
      const listRes = await fetch("/api/webauthn/authenticators");
      const listData = await listRes.json();
      setAuthenticators(listData.authenticators ?? []);
    } catch {
      setError("Failed to register passkey");
    } finally {
      setRegistering(false);
    }
  }, []);

  const handleDelete = async (credentialID: string) => {
    await fetch("/api/webauthn/authenticators", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credentialID }),
    });
    setAuthenticators((prev) => prev.filter((a) => a.credentialID !== credentialID));
  };

  const handleToggle2FA = async (enabled: boolean) => {
    // Require at least one passkey
    if (enabled && authenticators.length === 0) {
      setError("Register a passkey first before enabling 2FA");
      return;
    }
    await fetch("/api/auth/2fa/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setTwoFactorEnabled(enabled);
  };

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>Passkeys &amp; Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add a passkey to your account for passwordless login or two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Require passkey for login (2FA)</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, you'll need your passkey after entering your password
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Registered Passkeys</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegister}
                disabled={registering}
              >
                {registering ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Add Passkey
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : authenticators.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No passkeys registered</p>
                <p className="text-xs">Add a passkey to enable passwordless sign-in</p>
              </div>
            ) : (
              <div className="space-y-2">
                {authenticators.map((auth) => (
                  <div
                    key={auth.credentialID}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium">Passkey</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(auth.credentialID)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
