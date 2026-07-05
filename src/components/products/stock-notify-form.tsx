"use client";

import { useState } from "react";
import { subscribeStockNotificationAction } from "@/actions/stock-notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell } from "lucide-react";

export function StockNotifyForm({ productId }: { productId: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    const res = await subscribeStockNotificationAction(email, productId);
    setPending(false);
    if (res.success) {
      setStatus("success");
      setMessage("We'll email you when it's back!");
      setEmail("");
    } else {
      setStatus("error");
      setMessage(res.error ?? "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Notify me when back in stock</span>
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={pending} variant="outline" size="sm">
          {pending ? "..." : "Notify"}
        </Button>
      </div>
      {message && (
        <p className={`text-xs ${status === "success" ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
