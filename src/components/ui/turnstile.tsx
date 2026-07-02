"use client";

import { useRef, useEffect } from "react";

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
  onVerifyRef.current = onVerify;

  useEffect(() => {
    const id = "cf-turnstile-script";
    if (document.getElementById(id)) {
      if (window.turnstile && containerRef.current) {
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
          callback: (token: string) => onVerifyRef.current(token),
          "expired-callback": () => onVerifyRef.current(""),
        });
      }
      return;
    }

    window.turnstileCallback = () => {
      if (containerRef.current && window.turnstile) {
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
          callback: (token: string) => onVerifyRef.current(token),
          "expired-callback": () => onVerifyRef.current(""),
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

  return <div ref={containerRef} />;
}
