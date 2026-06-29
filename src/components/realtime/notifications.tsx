"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher-client";
import { useToast } from "@/hooks/use-toast";

export function RealtimeNotifications() {
  const { data: session } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    let pusherClient: Awaited<ReturnType<typeof getPusherClient>> = null;
    let channel: any = null;

    async function init() {
      if (!session?.user?.id) return;

      pusherClient = await getPusherClient();
      if (!pusherClient) return;

      channel = pusherClient.subscribe(`user-${session.user.id}`);

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
    }

    init();

    return () => {
      if (channel) channel.unbind_all();
      if (pusherClient && session?.user?.id) {
        pusherClient.unsubscribe(`user-${session.user.id}`);
      }
    };
  }, [session?.user?.id, toast]);

  return null;
}
