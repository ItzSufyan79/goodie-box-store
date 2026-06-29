import Pusher from "pusher";

export const pusherServer =
  process.env.PUSHER_APP_ID &&
  process.env.NEXT_PUBLIC_PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.NEXT_PUBLIC_PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        useTLS: true,
      })
    : null;

export async function getPusherClient() {
  if (
    !process.env.NEXT_PUBLIC_PUSHER_KEY ||
    !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  ) {
    return null;
  }

  const { default: PusherClient } = await import("pusher-js");
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  });
}

export async function notifyUser(
  userId: string,
  event: string,
  data: Record<string, unknown>
) {
  if (!pusherServer) return;
  await pusherServer.trigger(`user-${userId}`, event, data);
}

export async function notifyOrderUpdate(
  userId: string,
  orderId: string,
  status: string
) {
  await notifyUser(userId, "order-update", { orderId, status });
}

export async function notifyPriceDrop(
  userId: string,
  productId: string,
  title: string,
  newPrice: number
) {
  await notifyUser(userId, "price-drop", { productId, title, newPrice });
}
