"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Chat</h1>
        <p className="text-wraptors-muted mt-0.5">Internal messaging</p>
      </div>
      <Card className="border-wraptors-border bg-wraptors-charcoal/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageCircle className="h-12 w-12 text-wraptors-gold/60 mb-4" />
          <p className="text-wraptors-muted text-center">
            Chat is coming soon. Use notifications for updates.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
