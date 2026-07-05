"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import { RotateCcw, CheckCircle, XCircle, DollarSign, ArrowLeft, RefreshCw } from "lucide-react";

type ReturnRequestData = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  status: string;
  sellerNotes: string | null;
  total: number;
  paymentStatus: string;
  createdAt: string;
  reviewedAt: string | null;
  refundedAt: string | null;
};

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "outline" },
};

export function AdminReturnsClient({ requests }: { requests: ReturnRequestData[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sellerNotes, setSellerNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const selected = requests.find((r) => r.id === selectedId);

  const handleUpdate = async (status: "APPROVED" | "REJECTED" | "REFUNDED") => {
    if (!selectedId) return;
    setUpdating(true);
    try {
      const { updateReturnRequestAction } = await import("@/actions/returns");
      await updateReturnRequestAction(selectedId, { status, sellerNotes: sellerNotes || undefined });
      setSellerNotes("");
      setSelectedId(null);
      router.refresh();
    } catch {
      alert("Failed to update return request");
    } finally {
      setUpdating(false);
    }
  };

  if (selected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to all requests
        </button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Return Request</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Order {selected.orderNumber}</p>
              </div>
              <Badge variant={statusBadge[selected.status]?.variant ?? "outline"}>
                {statusBadge[selected.status]?.label ?? selected.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{selected.customerName}</p>
                <p className="text-xs text-muted-foreground">{selected.customerEmail}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Order Total</p>
                <p className="font-medium">{formatPrice(selected.total)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Requested</p>
                <p className="font-medium">{new Date(selected.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment</p>
                <Badge variant={selected.paymentStatus === "PAID" ? "default" : "secondary"}>
                  {selected.paymentStatus}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Reason</p>
              <div className="p-3 rounded-lg bg-muted text-sm">{selected.reason}</div>
            </div>

            {selected.sellerNotes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Your Notes</p>
                <div className="p-3 rounded-lg bg-muted text-sm">{selected.sellerNotes}</div>
              </div>
            )}

            {(selected.status === "PENDING" || selected.status === "APPROVED") && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Add Notes</p>
                  <Textarea
                    value={sellerNotes}
                    onChange={(e) => setSellerNotes(e.target.value)}
                    placeholder="Internal notes about this request..."
                    rows={3}
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  {selected.status === "PENDING" && (
                    <>
                      <Button onClick={() => handleUpdate("APPROVED")} disabled={updating} className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button onClick={() => handleUpdate("REJECTED")} disabled={updating} variant="destructive" className="gap-2">
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {selected.status === "APPROVED" && (
                    <Button onClick={() => handleUpdate("REFUNDED")} disabled={updating} className="gap-2">
                      <DollarSign className="h-4 w-4" />
                      Mark as Refunded
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <RotateCcw className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Return Requests</h1>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No return requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="border rounded-xl p-4 bg-card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelectedId(req.id); setSellerNotes(req.sellerNotes ?? ""); }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{req.orderNumber}</span>
                    <Badge variant={statusBadge[req.status]?.variant ?? "outline"}>
                      {statusBadge[req.status]?.label ?? req.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{req.reason}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span>{req.customerName}</span>
                    <span>{formatPrice(req.total)}</span>
                    <span>{new Date(req.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
                <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
