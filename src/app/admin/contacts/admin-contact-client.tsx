"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { replyContactAction } from "@/actions/contact-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  repliedAt: string | null;
  replyBody: string | null;
  createdAt: string;
}

export function AdminContactClient({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await replyContactAction(selected.id, reply);
      setReply("");
      setSelected(null);
      router.refresh();
    } catch {
      alert("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* List */}
      <div className="space-y-2">
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => { setSelected(msg); setReply(""); }}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                selected?.id === msg.id
                  ? "border-primary bg-primary/5"
                  : msg.repliedAt
                    ? "border-green-200 bg-green-50/50"
                    : "border-border hover:bg-accent"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${!msg.read ? "font-bold" : ""}`}>
                    {msg.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {msg.name} &lt;{msg.email}&gt;
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {msg.repliedAt ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Mail className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Detail / Reply */}
      <div>
        {selected ? (
          <div className="rounded-xl border p-6 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">From</p>
              <p className="text-sm font-medium">{selected.name} ({selected.email})</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subject</p>
              <p className="text-sm font-medium">{selected.subject}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Message</p>
              <p className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground bg-muted rounded-lg p-3">
                {selected.message}
              </p>
            </div>

            {selected.repliedAt && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Replied
                </p>
                <p className="text-sm text-green-800 mt-1 whitespace-pre-wrap">{selected.replyBody}</p>
                <p className="text-xs text-green-600 mt-1">
                  {new Date(selected.repliedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            )}

            <div className="pt-2 border-t">
              <label className="text-xs text-muted-foreground mb-2 block">
                Your reply (will send from <span className="font-mono">admin@goodieboxstore.online</span>)
              </label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={5}
                placeholder={`Hi ${selected.name},\n\n...`}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y mb-3"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                <Button onClick={handleSendReply} disabled={!reply.trim() || sending}>
                  {sending ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a message to reply</p>
          </div>
        )}
      </div>
    </div>
  );
}
