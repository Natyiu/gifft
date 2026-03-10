"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { AccountSettingsSkeleton } from "@/components/skeletons";

export default function AccountSettings() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  if (isPending) return <AccountSettingsSkeleton />;
  if (!session) return null;

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password. Check your current password.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      await authClient.deleteUser();
      toast.success("Account deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete account");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="border-border/30 bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm">Change Password</CardTitle>
          <CardDescription className="text-xs">
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-xs">
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-xs">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Separator className="opacity-30" />

          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !currentPassword || !newPassword}
              size="sm"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/30 bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm">Active Sessions</CardTitle>
          <CardDescription className="text-xs">
            Manage your active sessions across devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between border border-border/30 p-3">
            <div>
              <p className="text-xs font-medium">Current Session</p>
              <p className="text-[10px] text-muted-foreground">
                {session.session.ipAddress ?? "Unknown IP"} &middot;{" "}
                {session.session.userAgent?.split(" ")[0] ?? "Unknown device"}
              </p>
            </div>
            <span className="text-[10px] font-medium text-green-500">
              Active
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription className="text-xs">
            Irreversible actions. Proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove all of your data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount}>
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
