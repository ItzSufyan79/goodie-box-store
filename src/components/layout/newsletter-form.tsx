"use client";

import { useState } from "react";
import { subscribeNewsletterAction } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    const res = await subscribeNewsletterAction(email);
    setPending(false);
    if (res.success) {
      setStatus("success");
      setMessage("You're subscribed! 🎉");
      setEmail("");
    } else {
      setStatus("error");
      setMessage(res.error ?? "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-medium">Subscribe for updates</p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "..." : "Subscribe"}
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
