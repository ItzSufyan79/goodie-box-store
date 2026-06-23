"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher";
import { useToast } from "@/hooks/use-toast";

export function RealtimeNotifications() {
  const { data: session } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (!session?.user?.id) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(`user-${session.user.id}`);

    channel.bind("order-update", (data: { orderId: string; status: string }) => {
      toast({
        title: "Order Update",
        description: `Your order status changed to ${data.status}`,
      });
    });

    channel.bind(
      "price-drop",
      (data: { title: string; newPrice: number }) => {
        toast({
          title: "Price Drop Alert!",
          description: `${data.title} is now ₹${data.newPrice}`,
        });
      }
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${session.user.id}`);
    };
  }, [session?.user?.id, toast]);

  return null;
}
