"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Ban,
  UserX,
  UserCheck,
  Pencil,
} from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  image: string | null;
  createdAt: Date;
};

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleDialogUser, setRoleDialogUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authClient.admin.listUsers({
        query: {
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
          ...(search
            ? {
                searchValue: search,
                searchField: "email" as const,
                searchOperator: "contains" as const,
              }
            : {}),
        },
      });
      if (res.data) {
        setUsers(res.data.users as User[]);
        setTotal(res.data.total);
      }
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleSetRole(userId: string, role: string) {
    try {
      await authClient.admin.setRole({ userId, role: role as "admin" | "user" });
      toast.success(`Role updated to ${role}`);
      setRoleDialogUser(null);
      fetchUsers();
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function handleBan(userId: string) {
    try {
      await authClient.admin.banUser({
        userId,
        banReason: "Banned by admin",
      });
      toast.success("User banned");
      fetchUsers();
    } catch {
      toast.error("Failed to ban user");
    }
  }

  async function handleUnban(userId: string) {
    try {
      await authClient.admin.unbanUser({ userId });
      toast.success("User unbanned");
      fetchUsers();
    } catch {
      toast.error("Failed to unban user");
    }
  }

  async function handleRemove(userId: string) {
    try {
      await authClient.admin.removeUser({ userId });
      toast.success("User removed");
      fetchUsers();
    } catch {
      toast.error("Failed to remove user");
    }
  }

  async function handleEditSave() {
    if (!editUser) return;
    setEditSaving(true);
    try {
      const updates: Record<string, string> = {};
      if (editName && editName !== editUser.name) updates.name = editName;
      if (editEmail && editEmail !== editUser.email) updates.email = editEmail;

      if (Object.keys(updates).length > 0) {
        const { error } = await authClient.admin.updateUser({
          userId: editUser.id,
          data: updates,
        });
        if (error) throw error;
      }

      if (editPassword) {
        const { error } = await authClient.admin.setUserPassword({
          userId: editUser.id,
          newPassword: editPassword,
        });
        if (error) throw error;
      }

      toast.success("User updated");
      setEditUser(null);
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setEditSaving(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Users</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage users, roles, and access.
        </p>
      </div>

      <Card className="border-border/30 bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">{total} user{total !== 1 ? "s" : ""}</CardTitle>
              <CardDescription className="text-xs">
                Search, update roles, ban or remove users.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="border border-border/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">
                    User
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">
                    Role
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <p className="text-xs text-muted-foreground">
                        Loading...
                      </p>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <p className="text-xs text-muted-foreground">
                        No users found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={u.image ?? ""} />
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {u.name?.charAt(0).toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.role === "admin" ? "default" : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {u.role ?? "user"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.banned ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Banned
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] text-green-600 dark:text-green-400"
                          >
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Edit user"
                            onClick={() => {
                              setEditUser(u);
                              setEditName(u.name);
                              setEditEmail(u.email);
                              setEditPassword("");
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>

                          <Dialog
                            open={roleDialogUser?.id === u.id}
                            onOpenChange={(open) => {
                              if (open) {
                                setRoleDialogUser(u);
                                setSelectedRole(u.role ?? "user");
                              } else {
                                setRoleDialogUser(null);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Change role"
                              >
                                <Shield className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Change Role</DialogTitle>
                                <DialogDescription>
                                  Set the role for {u.name} ({u.email})
                                </DialogDescription>
                              </DialogHeader>
                              <Select
                                value={selectedRole}
                                onValueChange={setSelectedRole}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <DialogFooter>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm">
                                      Save
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Change Role</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to change {u.name}&apos;s role to <strong>{selectedRole}</strong>?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleSetRole(u.id, selectedRole)
                                        }
                                      >
                                        Confirm
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {u.banned ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="Unban user"
                                >
                                  <UserCheck className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Unban User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to unban {u.name} ({u.email})? They will be able to sign in again.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleUnban(u.id)}
                                  >
                                    Unban
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="Ban user"
                                >
                                  <Ban className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ban User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to ban {u.name} ({u.email})? They will be signed out and unable to log in.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleBan(u.id)}
                                  >
                                    Ban
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                title="Remove user"
                              >
                                <UserX className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove User
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to permanently delete {u.name} ({u.email}) and all their data? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemove(u.id)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!editUser}
        onOpenChange={(open) => {
          if (!open) setEditUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update details for {editUser?.name} ({editUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-xs">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Full name"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-xs">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password" className="text-xs">New Password</Label>
              <Input
                id="edit-password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="h-9 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditUser(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEditSave}
              disabled={editSaving}
            >
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
