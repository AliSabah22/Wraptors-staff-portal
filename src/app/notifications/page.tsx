"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useNotificationsStore } from "@/stores";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const { items, markAsRead, markAllAsRead } = useNotificationsStore();
  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-wraptors-muted mt-0.5">
            {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((n) => (
          <Card
            key={n.id}
            className={`border-wraptors-border transition-colors ${
              !n.read ? "border-l-4 border-l-wraptors-gold" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3 min-w-0">
                  <div
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      n.read ? "bg-wraptors-muted" : "bg-wraptors-gold"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-wraptors-muted mt-0.5">{n.message}</p>
                    <p className="text-xs text-wraptors-muted mt-2">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(n.id)}
                    >
                      Mark read
                    </Button>
                  )}
                  {n.link && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={n.link}>View</Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
