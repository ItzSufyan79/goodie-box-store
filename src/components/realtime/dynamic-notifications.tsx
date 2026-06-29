"use client";

import dynamic from "next/dynamic";

const RealtimeNotificationsInner = dynamic(
  () => import("@/components/realtime/notifications").then((m) => m.RealtimeNotifications),
  { ssr: false }
);

export function RealtimeNotifications() {
  return <RealtimeNotificationsInner />;
}
