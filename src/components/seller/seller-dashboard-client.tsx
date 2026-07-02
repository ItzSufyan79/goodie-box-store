"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  Plus,
  List,
  FileText,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { SellerOrderActions } from "@/components/seller/order-actions";
import { ReceiptButton } from "@/components/orders/receipt-dialog";

interface StatData {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
}

interface OrderItemData {
  id: string;
  orderId: string;
  title: string;
  quantity: number;
  price: number;
  status: string;
  product: { title: string };
  order: {
    user: { name: string | null; email: string };
    orderNumber: string;
    paymentStatus: string;
    paymentId: string | null;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
    subtotal: number;
    couponCode: string | null;
    trackingNumber: string | null;
    createdAt: string;
    items?: { title: string; quantity: number; price: number }[];
  };
}

export function SellerDashboardClient({
  initialStats,
  initialOrders,
}: {
  initialStats: StatData;
  initialOrders: OrderItemData[];
}) {
  const [stats, setStats] = useState(initialStats);
  const [orders, setOrders] = useState(initialOrders);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch("/api/seller/stats"),
        fetch("/api/seller/orders"),
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: Clock,
    },
    {
      title: "Revenue",
      value: formatPrice(stats.revenue),
      icon: DollarSign,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your products and orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/seller/orders">
              <Truck className="mr-2 h-4 w-4" /> Orders
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/seller/custom-requests">
              <FileText className="mr-2 h-4 w-4" /> Requests
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/seller/products">
              <List className="mr-2 h-4 w-4" /> My Products
            </Link>
          </Button>
          <Button asChild>
            <Link href="/seller/products/new">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No orders yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Product</th>
                    <th className="text-left py-3 px-2">Customer</th>
                    <th className="text-left py-3 px-2">Qty</th>
                    <th className="text-left py-3 px-2">Shipping</th>
                    <th className="text-left py-3 px-2">Tax</th>
                    <th className="text-left py-3 px-2">Total</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Payment</th>
                    <th className="text-left py-3 px-2">Receipt</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3 px-2 font-medium">
                        {item.product.title}
                      </td>
                      <td className="py-3 px-2">
                        {item.order.user.name ?? item.order.user.email}
                      </td>
                      <td className="py-3 px-2">{item.quantity}</td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatPrice(item.order.shipping)}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {formatPrice(item.order.tax)}
                      </td>
                      <td className="py-3 px-2 font-medium">
                        {formatPrice(item.order.total)}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">{item.status}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={item.order.paymentStatus === "PAID" ? "default" : "outline"}
                        >
                          {item.order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        {item.order.paymentStatus === "PAID" ? (
                          <ReceiptButton
                            orderNumber={item.order.orderNumber}
                            paymentId={item.order.paymentId}
                            items={item.order.items?.map((i: { title: string; quantity: number; price: number }) => ({
                              title: i.title,
                              quantity: i.quantity,
                              price: i.price,
                            })) ?? [{ title: item.title, quantity: item.quantity, price: item.price }]}
                            subtotal={item.order.subtotal}
                            shipping={item.order.shipping}
                            tax={item.order.tax}
                            discount={Number(item.order.discount ?? 0)}
                            couponCode={item.order.couponCode ?? null}
                            total={item.order.total}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <SellerOrderActions
                          orderId={item.orderId}
                          currentStatus={item.status}
                          paymentStatus={item.order.paymentStatus}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
