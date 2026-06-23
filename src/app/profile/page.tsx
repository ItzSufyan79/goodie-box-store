import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Truck } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/profile");

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{session.user.name ?? "Not set"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{session.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <Badge variant="outline">{session.user.role}</Badge>
          </div>

          <div className="pt-4 border-t space-y-2">
            <p className="text-sm font-medium text-muted-foreground">My Orders &amp; Requests</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/orders">
                  <Truck className="mr-1 h-4 w-4" /> Orders
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/my-requests">
                  <Gift className="mr-1 h-4 w-4" /> Custom Requests
                </Link>
              </Button>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="outline">
              Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
