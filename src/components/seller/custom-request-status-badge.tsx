"use client";

import { Badge } from "@/components/ui/badge";
import type { CustomRequestStatus } from "@prisma/client";

const variants: Record<CustomRequestStatus, "outline" | "secondary" | "default" | "success" | "destructive"> = {
  SUBMITTED: "outline",
  IN_REVIEW: "secondary",
  QUOTED: "default",
  APPROVED: "success",
  FULFILLED: "success",
  REJECTED: "destructive",
};

const labels: Record<CustomRequestStatus, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  QUOTED: "Quoted",
  APPROVED: "Approved",
  FULFILLED: "Fulfilled",
  REJECTED: "Rejected",
};

interface Props {
  status: CustomRequestStatus;
}

export function CustomRequestStatusBadge({ status }: Props) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
