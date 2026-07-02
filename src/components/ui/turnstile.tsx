"use client";

import { useRef, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface TurnstileProps {
  onVerify: (token: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    turnstileCallback?: () => void;
  }
}

export function Turnstile({ onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  onVerifyRef.current = onVerify;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAADt91TKqYI0n9-xl";
    if (!key) {
      setError(true);
      return;
    }

    const id = "cf-turnstile-script";
    if (document.getElementById(id)) {
      if (window.turnstile && containerRef.current) {
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: key,
          callback: (token: string) => {
            setReady(true);
            onVerifyRef.current(token);
          },
          "expired-callback": () => {
            setReady(false);
            onVerifyRef.current("");
          },
          "error-callback": () => {
            setError(true);
          },
        });
      }
      return;
    }

    window.turnstileCallback = () => {
      if (containerRef.current && window.turnstile) {
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: key,
          callback: (token: string) => {
            setReady(true);
            onVerifyRef.current(token);
          },
          "expired-callback": () => {
            setReady(false);
            onVerifyRef.current("");
          },
          "error-callback": () => {
            setError(true);
          },
        });
      }
    };

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=turnstileCallback";
    script.id = id;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, []);

  if (error) {
    return (
      <p className="text-xs text-destructive text-center">
        Security check unavailable. Please refresh the page.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[65px]">
      <div ref={containerRef} />
      {!ready && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Verifying browser...
        </div>
      )}
    </div>
  );
}
