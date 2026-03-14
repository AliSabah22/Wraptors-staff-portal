"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useMediaStore, useJobsStore } from "@/stores";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Plus, Video } from "lucide-react";
import { UploadMediaModal } from "@/components/media/upload-media-modal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { getScopedMedia } from "@/lib/data-scope/scope";

export default function MediaPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const allItems = useMediaStore((s) => s.items);
  const jobs = useJobsStore((s) => s.jobs);
  const { user, role } = useCurrentUser();
  const { hasPermission } = usePermissions();
  const hasFullMediaAccess = hasPermission("media.view") || hasPermission("media.manage");
  const items = useMemo(
    () => getScopedMedia(role, user?.id, allItems, jobs),
    [allItems, jobs, role, user?.id]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-wraptors-muted mt-0.5">
            {hasFullMediaAccess ? "All job photos and videos" : "Photos and videos from your assigned jobs"}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4" /> Upload media
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="border-wraptors-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wraptors-gold/10 text-wraptors-gold mb-4">
              <Camera className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-white">No media yet</h3>
            <p className="text-sm text-wraptors-muted mt-1 max-w-sm">
              Upload photos or videos from jobs to build your library.
            </p>
            <Button className="mt-6 gap-2" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" /> Upload media
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((m) => (
            <Card key={m.id} className="overflow-hidden border-wraptors-border">
              <div className="aspect-video bg-wraptors-charcoal flex items-center justify-center overflow-hidden">
                {m.type === "video" ? (
                  <Video className="h-10 w-10 text-wraptors-muted shrink-0" />
                ) : m.url.startsWith("data:") ? (
                  <img
                    src={m.url}
                    alt={m.title ?? m.caption ?? "Upload"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="h-10 w-10 text-wraptors-muted shrink-0" />
                )}
              </div>
              <CardContent className="p-3">
                <p className="text-xs text-wraptors-muted truncate">
                  {m.title || (m.jobId ? `Job ${m.jobId}` : "Media")}
                </p>
                {m.caption && (
                  <p className="text-xs text-wraptors-muted-light truncate mt-0.5">
                    {m.caption}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UploadMediaModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </motion.div>
  );
}
