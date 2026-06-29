import { redirect } from "next/navigation";
import { FileText, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getCustomRequestsAction } from "@/actions/products";
import { formatPrice } from "@/lib/utils";
import { CustomRequestStatusBadge } from "@/components/seller/custom-request-status-badge";
import { CustomRequestActions } from "@/components/seller/custom-request-actions";
import { CustomRequestPaymentToggle } from "@/components/seller/custom-request-payment-toggle";
import type { CustomRequestStatus } from "@prisma/client";

export default async function SellerCustomRequestsPage() {
  const session = await auth();
  if (!session?.user || !["SELLER", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  const requests = await getCustomRequestsAction();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Custom Requests</h1>
          <p className="text-muted-foreground">
            {requests.length} request{requests.length !== 1 && "s"} from customers
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No custom requests yet</h3>
            <p className="text-muted-foreground mb-6">
              When customers submit custom gift requests, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{request.title}</h3>
                      <CustomRequestStatusBadge status={request.status as CustomRequestStatus} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {request.description}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>From: {request.name}</span>
                      <span>Email: {request.user.email}</span>
                      <span>Phone: {request.phone}</span>
                      {request.occasion && <span>Occasion: {request.occasion}</span>}
                      {request.budget && (
                        <span>Budget: {formatPrice(request.budget)}</span>
                      )}
                      {request.quoteAmount && (
                        <span className="font-medium text-foreground flex items-center gap-0.5">
                          <IndianRupee className="h-3 w-3" />
                          Quote: {formatPrice(request.quoteAmount)}
                        </span>
                      )}
                      <span>
                        {new Date(request.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Payment:</span>
                      <CustomRequestPaymentToggle
                        requestId={request.id}
                        currentStatus={request.paymentStatus}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <CustomRequestActions
                      requestId={request.id}
                      currentStatus={request.status as CustomRequestStatus}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
