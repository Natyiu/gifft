"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Send,
  Paperclip,
  X,
  Users,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  sendNotification,
  sendNotificationToAll,
  getAdminNotificationHistory,
  getAllUsers,
} from "@/lib/actions/notifications";
import { NOTIFICATION_TAGS } from "@/lib/notification-tags";
import { uploadFile } from "@/lib/supabase";

const TAG_COLORS: Record<string, string> = {
  general: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  announcement: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  update: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  maintenance: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  security: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  billing: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  feature: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  urgent: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200",
};

type UserOption = { id: string; name: string | null; email: string };

type HistoryItem = {
  id: string;
  title: string;
  description: string;
  tag: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  senderId: string;
  createdAt: Date;
  recipientCount: number;
  readCount: number;
};

export default function AdminNotificationsPage() {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("general");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  useEffect(() => {
    loadUsers();
    loadHistory(1);
  }, []);

  async function loadUsers() {
    const result = await getAllUsers();
    setUsers(result);
  }

  async function loadHistory(page: number) {
    const result = await getAdminNotificationHistory({ page, limit: 10 });
    setHistory(result.notifications as unknown as HistoryItem[]);
    setHistoryPages(result.pages);
    setHistoryPage(page);
    setHistoryTotal(result.total);
  }

  function toggleUser(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      (u.name?.toLowerCase() ?? "").includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  async function handleSend() {
    if (!title.trim()) return toast.error("Title is required");
    if (!description.trim()) return toast.error("Description is required");
    if (!sendToAll && selectedUsers.length === 0) {
      return toast.error("Select at least one recipient");
    }

    startTransition(async () => {
      try {
        let attachmentUrl: string | undefined;
        let attachmentName: string | undefined;

        if (attachment) {
          const path = `notifications/${Date.now()}-${attachment.name}`;
          const result = await uploadFile("attachments", path, attachment);
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          attachmentUrl = result.url;
          attachmentName = attachment.name;
        }

        if (sendToAll) {
          await sendNotificationToAll({
            title: title.trim(),
            description: description.trim(),
            tag,
            attachmentUrl,
            attachmentName,
          });
        } else {
          await sendNotification({
            title: title.trim(),
            description: description.trim(),
            tag,
            attachmentUrl,
            attachmentName,
            recipientIds: selectedUsers,
          });
        }

        toast.success("Notification sent");
        setTitle("");
        setDescription("");
        setTag("general");
        setAttachment(null);
        setSelectedUsers([]);
        setSendToAll(true);
        loadHistory(1);
      } catch {
        toast.error("Failed to send notification");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Notifications</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Compose and send messages to your users.
        </p>
      </div>

      {/* Compose section */}
      <div className="border border-border">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Compose Notification</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Send messages to users with tags and optional attachments.
            </p>
          </div>
          <Send className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Tag
              </label>
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TAGS.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="capitalize">{t}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write the notification body..."
              rows={4}
              className="text-sm resize-none"
            />
          </div>

          {/* Attachment */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Attachment (optional)
            </label>
            {attachment ? (
              <div className="flex items-center gap-2 border border-border p-2.5">
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs truncate flex-1">
                  {attachment.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {(attachment.size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={() => setAttachment(null)}
                  className="p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 border border-dashed border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Click to attach a file
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAttachment(file);
                  }}
                />
              </label>
            )}
          </div>

          {/* Recipients */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="send-to-all"
                checked={sendToAll}
                onCheckedChange={(c) => setSendToAll(!!c)}
              />
              <label
                htmlFor="send-to-all"
                className="text-xs font-medium cursor-pointer"
              >
                Send to all users
              </label>
            </div>

            {!sendToAll && (
              <div className="border border-border">
                <div className="p-2 border-b border-border">
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="h-7 text-xs"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border">
                  {filteredUsers.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 p-2 hover:bg-muted/30 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedUsers.includes(u.id)}
                        onCheckedChange={() => toggleUser(u.id)}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {u.name ?? "Unnamed"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {u.email}
                        </p>
                      </div>
                    </label>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="p-3 text-xs text-muted-foreground text-center">
                      No users found
                    </p>
                  )}
                </div>
                {selectedUsers.length > 0 && (
                  <div className="p-2 border-t border-border bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">
                      {selectedUsers.length} user
                      {selectedUsers.length !== 1 ? "s" : ""} selected
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border px-5 py-3 flex justify-end">
          <Button
            onClick={handleSend}
            disabled={isPending}
            size="sm"
            className="text-xs gap-1.5"
          >
            <Send className="h-3 w-3" />
            {isPending ? "Sending..." : "Send Notification"}
          </Button>
        </div>
      </div>

      {/* History section */}
      <div className="border border-border">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Sent History</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {historyTotal} notification{historyTotal !== 1 ? "s" : ""} sent
            </p>
          </div>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Send className="h-8 w-8 text-muted-foreground/20 mb-3" />
            <p className="text-xs text-muted-foreground">
              No notifications sent yet
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {history.map((item) => (
                <div key={item.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xs font-semibold truncate">
                          {item.title}
                        </h3>
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-px ${TAG_COLORS[item.tag] ?? TAG_COLORS.general}`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      {item.attachmentName && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Paperclip className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            {item.attachmentName}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Users className="h-2.5 w-2.5" />
                          {item.recipientCount}
                        </span>
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Eye className="h-2.5 w-2.5" />
                          {item.readCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {historyPages > 1 && (
              <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  Page {historyPage} of {historyPages}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    disabled={historyPage <= 1}
                    onClick={() => loadHistory(historyPage - 1)}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    disabled={historyPage >= historyPages}
                    onClick={() => loadHistory(historyPage + 1)}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
