"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Paperclip,
  Check,
  CheckCheck,
  Download,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Filter,
} from "lucide-react";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { NOTIFICATION_TAGS } from "@/lib/notification-tags";

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

type NotificationItem = {
  id: string;
  notificationId: string;
  title: string;
  description: string;
  tag: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
};

export default function NotificationsPage() {
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [tagFilter, setTagFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagFilter, unreadOnly]);

  async function load(page: number) {
    const result = await getUserNotifications({
      tag: tagFilter === "all" ? undefined : tagFilter,
      unreadOnly,
      page,
      limit: 15,
    });
    setNotifications(result.notifications as unknown as NotificationItem[]);
    setTotal(result.total);
    setPages(result.pages);
    setCurrentPage(result.currentPage);
  }

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true, readAt: new Date() } : n,
        ),
      );
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date() })));
    });
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  function timeAgo(date: Date) {
    const now = new Date();
    const d = new Date(date);
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight">
            <Bell className="h-6 w-6 text-primary" /> Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} notification{total !== 1 ? "s" : ""}{" "}
            {unreadCount > 0 && (
              <span className="font-medium text-primary">
                — {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={handleMarkAllRead}
            disabled={isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Filter</span>
        </div>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="h-9 w-40 rounded-full text-sm">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {NOTIFICATION_TAGS.map((t) => (
              <SelectItem key={t} value={t}>
                <span className="capitalize">{t}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={unreadOnly ? "default" : "outline"}
          size="sm"
          className="gap-1 rounded-full"
          onClick={() => setUnreadOnly(!unreadOnly)}
        >
          <Bell className="h-4 w-4" />
          Unread only
        </Button>
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Inbox className="mb-4 h-10 w-10 text-muted-foreground/30" />
          <h3 className="text-base font-semibold">No notifications</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadOnly
              ? "You've read all your notifications."
              : "You're all caught up. Nothing to see here."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {notifications.map((n) => {
            const isExpanded = expandedId === n.id;
            return (
              <div
                key={n.id}
                className={`transition-colors ${!n.read ? "bg-primary/5" : ""}`}
              >
                <button
                  onClick={() => {
                    toggleExpand(n.id);
                    if (!n.read) handleMarkRead(n.id);
                  }}
                  className="w-full p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start gap-3">
                    {/* Unread indicator */}
                    <div className="shrink-0 pt-1.5">
                      {!n.read ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      ) : (
                        <div className="h-2.5 w-2.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-2">
                        <h3
                          className={`truncate text-sm ${!n.read ? "font-semibold" : "font-medium text-muted-foreground"}`}
                        >
                          {n.title}
                        </h3>
                        <span
                          className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TAG_COLORS[n.tag] ?? TAG_COLORS.general}`}
                        >
                          {n.tag}
                        </span>
                        {n.attachmentUrl && (
                          <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {n.description}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="space-y-3 px-4 pb-4 pl-11">
                    <div className="border-l-2 border-border pl-3">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {n.description}
                      </p>
                    </div>

                    {n.attachmentUrl && (
                      <a
                        href={n.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted/40"
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span>{n.attachmentName ?? "Download attachment"}</span>
                      </a>
                    )}

                    <div className="flex items-center gap-2">
                      {!n.read ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(n.id);
                          }}
                          disabled={isPending}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark as read
                        </Button>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Check className="h-3.5 w-3.5" />
                          Read
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {pages}
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              disabled={currentPage <= 1}
              onClick={() => load(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              disabled={currentPage >= pages}
              onClick={() => load(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
