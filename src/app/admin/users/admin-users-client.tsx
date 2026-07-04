"use client";

import { useState } from "react";
import { Users, Shield, ShieldOff, Lock, Unlock, Mail, CheckCircle, XCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { updateUserRoleAction, toggleUserLockAction } from "@/actions/admin-users";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  emailVerified: string | null;
  role: string;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lockoutUntil: string | null;
  createdAt: string;
  _count: { orders: number; products: number };
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  SELLER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CUSTOMER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const isLocked = (u: UserData) => u.lockoutUntil && new Date(u.lockoutUntil) > new Date();

export function AdminUsersClient({ users: initial }: { users: UserData[] }) {
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (userId: string, role: "CUSTOMER" | "SELLER" | "ADMIN") => {
    setLoading(userId);
    try {
      await updateUserRoleAction(userId, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setLoading(null);
    }
  };

  const handleLockToggle = async (userId: string) => {
    setLoading(userId);
    try {
      const res = await toggleUserLockAction(userId);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const now = new Date();
          return {
            ...u,
            lockoutUntil: res.locked
              ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
              : null,
            failedLoginAttempts: res.locked ? 5 : 0,
          };
        })
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to toggle lock");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            {users.length} registered users
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Verified</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">2FA</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Orders</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Products</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {(user.name ?? user.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[160px]">
                            {user.name ?? "Unnamed"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined{" "}
                            {new Date(user.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate max-w-[180px]">
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(
                            user.id,
                            e.target.value as "CUSTOMER" | "SELLER" | "ADMIN"
                          )
                        }
                        disabled={loading === user.id}
                        className={`text-xs font-medium rounded-md px-2 py-1 border ${
                          roleColors[user.role] ?? ""
                        }`}
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="SELLER">Seller</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      {user.emailVerified ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {user.twoFactorEnabled ? (
                        <Shield className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <ShieldOff className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      {user._count.orders}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      {user._count.products}
                    </td>
                    <td className="p-4 text-center">
                      {isLocked(user) ? (
                        <Badge variant="destructive" className="text-xs">Locked</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLockToggle(user.id)}
                          disabled={loading === user.id}
                          title={isLocked(user) ? "Unlock account" : "Lock account"}
                        >
                          {isLocked(user) ? (
                            <Unlock className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No users found</p>
        </div>
      )}
    </div>
  );
}
