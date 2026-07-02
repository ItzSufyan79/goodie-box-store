import Link from "next/link";
import { redirect } from "next/navigation";
import { Gift, Clock, CheckCircle, XCircle, Eye, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerCustomRequestsAction } from "@/actions/products";
import { formatPrice } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { ReceiptButton } from "@/components/orders/receipt-dialog";

const statusLabels: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  QUOTED: "Quoted",
  APPROVED: "Approved",
  FULFILLED: "Fulfilled",
  REJECTED: "Rejected",
};

const statusIcons: Record<string, typeof Clock> = {
  SUBMITTED: Clock,
  IN_REVIEW: Eye,
  QUOTED: MessageSquare,
  APPROVED: CheckCircle,
  FULFILLED: CheckCircle,
  REJECTED: XCircle,
};

const statusColors: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  SUBMITTED: "outline",
  IN_REVIEW: "secondary",
  QUOTED: "default",
  APPROVED: "default",
  FULFILLED: "default",
  REJECTED: "destructive",
};

const paymentLabels: Record<string, string> = {
  PENDING: "Unpaid",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export default async function MyRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/my-requests");

  const requests = await getCustomerCustomRequestsAction();

  if (requests.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">No custom requests yet</h1>
        <p className="text-muted-foreground mb-6">
          Tell us what you&apos;re looking for and we&apos;ll create a
          personalized gift box just for you.
        </p>
        <Button asChild>
          <Link href="/custom-request">Submit a Request</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Custom Requests</h1>
          <p className="text-muted-foreground">
            Track the status of your gift requests
          </p>
        </div>
        <Button asChild className="self-start sm:self-auto">
          <Link href="/custom-request">New Request</Link>
        </Button>
      </div>

      <div className="space-y-4">
        {requests.map((request) => {
          const StatusIcon =
            statusIcons[request.status] ?? Clock;
          return (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      {request.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Submitted{" "}
                      {new Date(request.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={request.paymentStatus === "PAID" ? "default" : "outline"}
                    >
                      {paymentLabels[request.paymentStatus] ?? request.paymentStatus}
                    </Badge>
                    <Badge
                      variant={statusColors[request.status] ?? "outline"}
                      className="flex items-center gap-1"
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusLabels[request.status] ?? request.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {request.description}
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  {request.budget && (
                    <div>
                      <span className="text-muted-foreground">Budget: </span>
                      <span className="font-medium">
                        {formatPrice(request.budget)}
                      </span>
                    </div>
                  )}
                  {request.occasion && (
                    <div>
                      <span className="text-muted-foreground">Occasion: </span>
                      <span className="font-medium">{request.occasion}</span>
                    </div>
                  )}
                  {request.adminNotes && (
                    <div className="w-full pt-2 border-t mt-2">
                      <span className="text-muted-foreground">Response: </span>
                      <span className="font-medium">{request.adminNotes}</span>
                    </div>
                  )}
                  {request.quoteAmount && (
                    <div>
                      <span className="text-muted-foreground">Quote: </span>
                      <span className="font-medium">
                        {formatPrice(request.quoteAmount)}
                      </span>
                    </div>
                  )}
                </div>
                {request.paymentStatus === "PAID" && request.quoteAmount && (
                  <div className="mt-4 pt-3 border-t flex justify-end">
                    <ReceiptButton
                      orderNumber={`CR-${request.id.slice(0, 8)}`}
                      paymentId={null}
                      items={[{ title: request.title, quantity: 1, price: request.quoteAmount }]}
                      subtotal={request.quoteAmount}
                      shipping={0}
                      tax={0}
                      discount={0}
                      couponCode={null}
                      total={request.quoteAmount}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
