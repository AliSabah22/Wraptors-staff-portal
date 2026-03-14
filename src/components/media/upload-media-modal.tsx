"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMediaStore, useCustomersStore, useJobsStore } from "@/stores";
import { uploadMediaSchema, type UploadMediaFormValues } from "@/lib/validations";
import { SHOP_ID } from "@/lib/constants";
import type { MediaAsset } from "@/types";
import { Camera, Check, Loader2, Upload } from "lucide-react";

const UPLOAD_BY = "staff_1";

type UploadMediaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UploadMediaModal({ open, onOpenChange }: UploadMediaModalProps) {
  const [success, setSuccess] = useState(false);
  const [filePreview, setFilePreview] = useState<{ url: string; type: "photo" | "video" } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMedia = useMediaStore((s) => s.addMedia);
  const customers = useCustomersStore((s) => s.customers);
  const jobs = useJobsStore((s) => s.jobs);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadMediaFormValues>({
    resolver: zodResolver(uploadMediaSchema),
    defaultValues: {
      title: "",
      caption: "",
      jobId: "",
      customerId: "",
      vehicleId: "",
    },
  });

  const onClose = () => {
    setSuccess(false);
    setFilePreview(null);
    setSelectedFile(null);
    reset();
    onOpenChange(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFilePreview(null);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    const isVideo = file.type.startsWith("video/");
    const type = isVideo ? "video" as const : "photo" as const;
    if (isVideo) {
      setFilePreview({ url: URL.createObjectURL(file), type: "video" });
    } else {
      const reader = new FileReader();
      reader.onload = () => setFilePreview({ url: reader.result as string, type: "photo" });
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: UploadMediaFormValues) => {
    if (!selectedFile || !filePreview) return;
    const now = new Date().toISOString();
    const id = `media_${Date.now()}`;
    const isVideo = selectedFile.type.startsWith("video/");
    const asset: MediaAsset = {
      id,
      shopId: SHOP_ID,
      jobId: data.jobId?.trim() || undefined,
      customerId: data.customerId?.trim() || undefined,
      vehicleId: data.vehicleId?.trim() || undefined,
      type: isVideo ? "video" : "photo",
      url: filePreview.url,
      title: data.title?.trim(),
      caption: data.caption?.trim(),
      visibility: "internal",
      uploadedBy: UPLOAD_BY,
      createdAt: now,
    };
    addMedia(asset);
    setSuccess(true);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !success && onOpenChange(o)}>
      <DialogContent
        className="max-w-md border-wraptors-border bg-wraptors-surface"
        onPointerDownOutside={(e) => success && e.preventDefault()}
      >
        {success ? (
          <>
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wraptors-gold/20 text-wraptors-gold">
                <Check className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center">Media uploaded</DialogTitle>
              <DialogDescription className="text-center">
                It’s now in the Media Library. You can assign it to jobs or customers later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center pt-4">
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-wraptors-gold" />
                Upload media
              </DialogTitle>
              <DialogDescription>
                Add a photo or video. Optionally assign to a job, customer, or vehicle.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label>File</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-wraptors-border bg-wraptors-charcoal/50 p-4 transition-colors hover:border-wraptors-gold/50 hover:bg-wraptors-charcoal"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={onFileChange}
                  />
                  {filePreview ? (
                    <>
                      {filePreview.type === "photo" ? (
                        <img
                          src={filePreview.url}
                          alt="Preview"
                          className="max-h-32 max-w-full rounded-lg object-contain"
                        />
                      ) : (
                        <div className="flex h-24 w-full items-center justify-center rounded-lg bg-wraptors-surface text-wraptors-muted">
                          <Camera className="h-10 w-10" /> Video selected
                        </div>
                      )}
                      <p className="mt-2 text-xs text-wraptors-muted">{selectedFile?.name}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-wraptors-muted" />
                      <p className="mt-2 text-sm text-wraptors-muted">Click to select image or video</p>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-wraptors-border/50 pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-wraptors-muted mb-3">Details</p>
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input id="title" placeholder="e.g. Hood progress" {...register("title")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Textarea id="caption" placeholder="Description" rows={2} {...register("caption")} />
              </div>
              </div>

              <div className="border-t border-wraptors-border/50 pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-wraptors-muted mb-3">Assign to (optional)</p>
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="jobId">Job</Label>
                    <select
                      id="jobId"
                      className="flex h-10 w-full rounded-lg border border-wraptors-border bg-wraptors-charcoal px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-wraptors-gold/50"
                      {...register("jobId")}
                    >
                      <option value="">—</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer</Label>
                    <select
                      id="customerId"
                      className="flex h-10 w-full rounded-lg border border-wraptors-border bg-wraptors-charcoal px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-wraptors-gold/50"
                      {...register("customerId")}
                    >
                      <option value="">—</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-4 border-t border-wraptors-border/50 mt-6">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
