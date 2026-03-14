"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, User, Car, Wrench, UserCog, Camera, StickyNote, Check, Trash2, Loader2, AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DeleteCustomerOptionsDialog } from "@/components/customers/delete-customer-options-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { useJobsStore, useMediaStore } from "@/stores";
import { CustomerProfileModal } from "@/components/customers/customer-profile-modal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { formatCurrency, formatDate, formatDateTime, formatJobStage } from "@/lib/utils";
import { jobNoteSchema, type JobNoteFormValues } from "@/lib/validations";
import { SHOP_ID } from "@/lib/constants";
import { getAllowedNextStages, stageRequiresPhoto, canTransitionTo } from "@/lib/job-workflow/stage-transitions";
import {
  BLOCKER_REASON_OPTIONS,
  JOB_STATUS_LABELS,
  JOB_PRIORITY_LABELS,
  RECEPTIONIST_SETTABLE_STATUSES,
  VISIBILITY_OPTIONS,
  REQUIRED_PHOTO_STAGE_MESSAGE,
  isStandardPriority,
} from "@/lib/job-workflow/config";
import { getJobNotesForDisplay } from "@/lib/job-notes";
import type { ServiceJob, JobStage, JobPriority, JobStatus } from "@/types";
import type { Customer, Vehicle, Service, StaffUser, MediaAsset } from "@/types";

interface JobDetailViewProps {
  job: ServiceJob;
  customer: Customer | null;
  vehicle: Vehicle | null;
  service: Service | null;
  technician: StaffUser | null;
  allStages: readonly JobStage[];
  stageProgressMap: Record<JobStage, number>;
  technicians: StaffUser[];
}

export function JobDetailView({
  job,
  customer,
  vehicle,
  service,
  technician,
  allStages,
  stageProgressMap,
  technicians,
}: JobDetailViewProps) {
  const router = useRouter();
  const { user, role } = useCurrentUser();
  const { hasPermission } = usePermissions();
  const updateJobStage = useJobsStore((s) => s.updateJobStage);
  const setJobBlocker = useJobsStore((s) => s.setJobBlocker);
  const setJobPriority = useJobsStore((s) => s.setJobPriority);
  const setJobStatus = useJobsStore((s) => s.setJobStatus);
  const setScheduledStartDate = useJobsStore((s) => s.setScheduledStartDate);
  const setPickupTargetTime = useJobsStore((s) => s.setPickupTargetTime);
  const setDropOffDate = useJobsStore((s) => s.setDropOffDate);
  const setDueDate = useJobsStore((s) => s.setDueDate);
  const addJobNote = useJobsStore((s) => s.addJobNote);
  const assignTechnician = useJobsStore((s) => s.assignTechnician);
  const addMediaToJob = useJobsStore((s) => s.addMediaToJob);
  const addMedia = useMediaStore((s) => s.addMedia);
  const getMediaById = useMediaStore((s) => s.getById);
  const [stageSelectOpen, setStageSelectOpen] = useState(false);
  const [stagePhotoRequiredMessage, setStagePhotoRequiredMessage] = useState<string | null>(null);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const handleSaveChanges = () => {
    setSaveMessage("Changes saved. Updates will appear on the calendar.");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const canOverrideStageRules = role === "ceo" || role === "receptionist";
  const allowedStagesForRole: JobStage[] =
    !canOverrideStageRules && role === "technician"
      ? [job.stage, ...getAllowedNextStages(job.stage)]
      : [...allStages];
  const stageOptions = allowedStagesForRole.filter((s, i, arr) => arr.indexOf(s) === i);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JobNoteFormValues>({
    resolver: zodResolver(jobNoteSchema),
    defaultValues: { note: "", visibility: "internal" },
  });

  const onUpdateStage = (stage: JobStage) => {
    setStagePhotoRequiredMessage(null);
    if (stage === job.stage) {
      setStageSelectOpen(false);
      return;
    }
    if (role === "technician" && !canTransitionTo(job.stage, stage, role)) {
      setStagePhotoRequiredMessage("You can only move to an allowed next or previous stage.");
      setStageSelectOpen(true);
      return;
    }
    if (
      role === "technician" &&
      stageRequiresPhoto(stage) &&
      (!job.mediaIds || job.mediaIds.length === 0)
    ) {
      setStagePhotoRequiredMessage(REQUIRED_PHOTO_STAGE_MESSAGE);
      setStageSelectOpen(true);
      return;
    }
    updateJobStage(job.id, stage, undefined, user?.id ?? "staff_4");
    setStageSelectOpen(false);
  };

  const onAddNote = (data: JobNoteFormValues) => {
    addJobNote(job.id, data.note, data.visibility, user?.id);
    reset({ note: "", visibility: "internal" });
    setNoteFormOpen(false);
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setMediaUploading(true);
    if (isVideo) {
      const url = URL.createObjectURL(file);
      const now = new Date().toISOString();
      const id = `media_${Date.now()}`;
      const asset: MediaAsset = {
        id,
        shopId: SHOP_ID,
        jobId: job.id,
        customerId: customer?.id,
        vehicleId: vehicle?.id,
        type: "video",
        url,
        visibility: "internal",
        uploadedBy: user?.id ?? "staff_1",
        createdAt: now,
      };
      addMedia(asset);
      addMediaToJob(job.id, id);
      setMediaUploading(false);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const now = new Date().toISOString();
        const id = `media_${Date.now()}`;
        const asset: MediaAsset = {
          id,
          shopId: SHOP_ID,
          jobId: job.id,
          customerId: customer?.id,
          vehicleId: vehicle?.id,
          type: "photo",
          url,
          visibility: "internal",
          uploadedBy: user?.id ?? "staff_1",
          createdAt: now,
        };
        addMedia(asset);
        addMediaToJob(job.id, id);
        setMediaUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {vehicle?.make} {vehicle?.model} — {customer?.name}
            </h1>
            {!isStandardPriority(job.priority) && (
              <Badge variant="outline" className="border-wraptors-gold/50 text-wraptors-gold">
                {JOB_PRIORITY_LABELS[job.priority!]}
              </Badge>
            )}
            {job.status === "blocked" && (
              <Badge variant="destructive">Blocked</Badge>
            )}
          </div>
          <p className="text-wraptors-muted mt-0.5">
            {service?.name} · Due {formatDate(job.dueDate)}
          </p>
        </div>
        <Button
          onClick={handleSaveChanges}
          className="shrink-0 bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold/90"
        >
          <Save className="h-4 w-4 mr-2" />
          Save changes
        </Button>
      </div>

      {saveMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          <Check className="h-4 w-4 shrink-0" />
          {saveMessage}
        </div>
      )}

      {job.isBlocked && job.blockerReason && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
            <div className="flex-1">
              <p className="font-medium text-red-200">Job blocked</p>
              <p className="text-sm text-red-200/80">{job.blockerReason}</p>
            </div>
            {(hasPermission("jobs.edit_basic") || hasPermission("jobs.update_status")) && (
              <Button
                variant="outline"
                size="sm"
                className="border-red-400/50 text-red-200 hover:bg-red-500/20"
                onClick={() => setJobBlocker(job.id, false, undefined, user?.id)}
              >
                Unblock
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Customer, Vehicle, Service, Technician */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-wraptors-gold" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{customer?.name ?? "—"}</p>
              <p className="text-wraptors-muted">{customer?.phone ?? "—"}</p>
              {customer?.email && (
                <p className="text-wraptors-muted">{customer.email}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {customer?.id && (
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 h-auto"
                    onClick={() => setProfileModalOpen(true)}
                  >
                    View profile
                  </Button>
                )}
                {customer?.id && hasPermission("customers.delete") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-400/50 hover:bg-red-500/10 hover:text-red-300 h-auto py-1"
                    onClick={() => setDeleteCustomerOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete customer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <DeleteCustomerOptionsDialog
            open={deleteCustomerOpen}
            onOpenChange={setDeleteCustomerOpen}
            customerId={customer?.id ?? null}
            customerName={customer?.name ?? "Customer"}
            onDeletedEntirely={() => router.push("/jobs")}
          />

          <CustomerProfileModal
            open={profileModalOpen}
            onOpenChange={setProfileModalOpen}
            customer={customer}
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-4 w-4 text-wraptors-gold" /> Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">
                {vehicle?.year} {vehicle?.make} {vehicle?.model}
              </p>
              {vehicle?.color && (
                <p className="text-wraptors-muted">{vehicle.color}</p>
              )}
              {vehicle?.vin && (
                <p className="text-wraptors-muted text-xs">VIN: {vehicle.vin}</p>
              )}
              {vehicle?.plate && (
                <p className="text-wraptors-muted text-xs">Plate: {vehicle.plate}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 text-wraptors-gold" /> Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{service?.name ?? "—"}</p>
              <p className="text-wraptors-muted">{service?.description ?? ""}</p>
              {service?.estimatedPrice != null && (
                <p className="text-wraptors-gold font-medium mt-1">
                  {formatCurrency(service.estimatedPrice)} est.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCog className="h-4 w-4 text-wraptors-gold" /> Scheduling &amp; Assignment
              </CardTitle>
              <p className="text-xs text-wraptors-muted mt-1">Managed by operations</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-wraptors-muted text-xs">Assigned technician</Label>
                {hasPermission("jobs.assign") ? (
                  <Select
                    value={job.assignedTechnicianId ?? ""}
                    onValueChange={(id) => assignTechnician(job.id, id || undefined)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-wraptors-muted-light mt-1">{technician?.name ?? "Unassigned"}</p>
                )}
              </div>
              <div>
                <Label className="text-wraptors-muted text-xs">Scheduled start</Label>
                {hasPermission("jobs.assign") ? (
                  <div className="mt-1">
                    <DateTimePicker
                      value={job.scheduledStartDate?.slice(0, 16) ?? undefined}
                      onChange={(v) => setScheduledStartDate(job.id, v)}
                      placeholder="Select start date & time"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-wraptors-muted-light mt-1">
                    {job.scheduledStartDate ? formatDateTime(job.scheduledStartDate) : "—"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-wraptors-muted text-xs">Due date</Label>
                {hasPermission("jobs.edit_basic") ? (
                  <div className="mt-1">
                    <DatePicker
                      value={job.dueDate?.slice(0, 10) ?? undefined}
                      onChange={(v) => setDueDate(job.id, v ?? "")}
                      placeholder="Select due date"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-wraptors-muted-light mt-1">{job.dueDate ? formatDate(job.dueDate) : "—"}</p>
                )}
              </div>
              <div>
                <Label className="text-wraptors-muted text-xs">Pickup target</Label>
                {hasPermission("jobs.assign") ? (
                  <div className="mt-1">
                    <DateTimePicker
                      value={job.pickupTargetTime?.slice(0, 16) ?? undefined}
                      onChange={(v) => setPickupTargetTime(job.id, v)}
                      placeholder="Select pickup date & time"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-wraptors-muted-light mt-1">
                    {job.pickupTargetTime ? formatDateTime(job.pickupTargetTime) : "—"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-wraptors-muted text-xs">Priority</Label>
                {hasPermission("jobs.edit_basic") ? (
                  <Select
                    value={job.priority ?? "standard"}
                    onValueChange={(v) => setJobPriority(job.id, v as JobPriority)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["low", "standard", "urgent", "rush"] as const).map((p) => (
                        <SelectItem key={p} value={p}>{JOB_PRIORITY_LABELS[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-wraptors-muted-light mt-1">{JOB_PRIORITY_LABELS[job.priority ?? "standard"]}</p>
                )}
              </div>
              {job.estimatedDurationMinutes != null && (
                <div>
                  <Label className="text-wraptors-muted text-xs">Est. duration</Label>
                  <p className="text-sm text-wraptors-muted-light mt-1">{job.estimatedDurationMinutes} min</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Operational status</CardTitle>
              <p className="text-xs text-wraptors-muted mt-1">Coordination and blockers</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-wraptors-muted text-xs">Status</Label>
                {hasPermission("jobs.edit_basic") && !job.isBlocked ? (
                  <Select
                    value={job.status ?? "active"}
                    onValueChange={(v) => setJobStatus(job.id, v as JobStatus)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECEPTIONIST_SETTABLE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {JOB_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-wraptors-muted-light mt-1">
                    <Badge variant="outline">{JOB_STATUS_LABELS[job.status ?? "active"]}</Badge>
                  </p>
                )}
              </div>
              {!job.isBlocked && hasPermission("jobs.update_status") && (
                <div className="flex flex-wrap gap-2">
                  {BLOCKER_REASON_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      variant="outline"
                      size="sm"
                      className="text-amber-400 border-amber-400/50 hover:bg-amber-500/10"
                      onClick={() => setJobBlocker(job.id, true, opt.value, user?.id)}
                    >
                      Block ({opt.shortLabel})
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Progress, timeline, notes, media, activity */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Progress</CardTitle>
                <p className="text-xs text-wraptors-muted mt-0.5">Updated by technician workflow</p>
              </div>
              <Select
                open={stageSelectOpen}
                onOpenChange={setStageSelectOpen}
                value={job.stage}
                onValueChange={(v) => onUpdateStage(v as JobStage)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stageOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {formatJobStage(s)} ({stageProgressMap[s]}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {stagePhotoRequiredMessage && (
                <p className="text-sm text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {stagePhotoRequiredMessage}
                </p>
              )}
              <Progress value={job.progress} className="h-3" />
              <p className="text-sm text-wraptors-muted mt-2">
                {job.progress}% — {formatJobStage(job.stage)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stage timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-wraptors-muted mb-4">
                Updates shown to customer in mobile app.
              </p>
              <ul className="space-y-3">
                {[...job.stageUpdates].reverse().map((u) => (
                  <li
                    key={u.id}
                    className="flex gap-3 rounded-lg border border-wraptors-border/50 p-3"
                  >
                    <div className="h-2 w-2 shrink-0 rounded-full bg-wraptors-gold mt-1.5" />
                    <div>
                      <p className="font-medium">
                        {formatJobStage(u.stage)} — {u.progress}%
                      </p>
                      {u.note && (
                        <p className="text-sm text-wraptors-muted mt-0.5">{u.note}</p>
                      )}
                      <p className="text-xs text-wraptors-muted mt-1">
                        {formatDateTime(u.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-wraptors-gold" /> Notes
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNoteFormOpen(!noteFormOpen)}
              >
                Add note
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-wraptors-muted">Internal notes are portal-only; customer-visible notes can appear in the app.</p>
              {noteFormOpen && (
                <form onSubmit={handleSubmit(onAddNote)} className="space-y-2">
                  <Input
                    {...register("note")}
                    placeholder="Add a note..."
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label className="text-wraptors-muted text-xs">Visibility</Label>
                    <Select
                      value={watch("visibility")}
                      onValueChange={(v) => setValue("visibility", v as "internal" | "customer_visible")}
                    >
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIBILITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="submit">Save</Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setNoteFormOpen(false);
                        reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
              </form>
              )}
              {errors.note && (
                <p className="text-sm text-red-400">{errors.note.message}</p>
              )}
              <ul className="space-y-2">
                {(() => {
                  const displayNotes = getJobNotesForDisplay(job);
                  if (displayNotes.length === 0 && !noteFormOpen) {
                    return <p className="text-sm text-wraptors-muted">No notes yet.</p>;
                  }
                  return displayNotes.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-lg bg-wraptors-charcoal/50 px-3 py-2 text-sm border border-wraptors-border/50 flex items-start justify-between gap-2"
                    >
                      <span className="flex-1">{n.text}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {VISIBILITY_OPTIONS.find((o) => o.value === n.visibility)?.label ?? n.visibility.replace("_", " ")}
                      </Badge>
                    </li>
                  ));
                })()}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-wraptors-gold" /> Media uploads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-wraptors-muted mb-4">
                Upload photos/videos.
              </p>
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaFileChange}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {job.mediaIds.map((id) => {
                  const asset = getMediaById(id);
                  return (
                    <div
                      key={id}
                      className="aspect-video rounded-lg bg-wraptors-charcoal border border-wraptors-border overflow-hidden flex items-center justify-center"
                    >
                      {asset?.type === "photo" && asset.url ? (
                        <img
                          src={asset.url}
                          alt={asset.title ?? "Uploaded media"}
                          className="w-full h-full object-cover"
                        />
                      ) : asset?.type === "video" ? (
                        <div className="flex flex-col items-center justify-center gap-1 text-wraptors-muted text-sm">
                          <Camera className="h-8 w-8" />
                          Video
                        </div>
                      ) : (
                        <span className="text-wraptors-muted text-sm">Media #{id}</span>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  disabled={mediaUploading}
                  onClick={() => mediaInputRef.current?.click()}
                  className="aspect-video rounded-lg border border-dashed border-wraptors-border text-wraptors-muted hover:border-wraptors-gold/50 hover:text-wraptors-gold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {mediaUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-5 w-5" /> Add photo/video
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-4 w-4 text-wraptors-gold" /> Activity log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {[
                  { id: "created", at: job.createdAt, label: "Job created" },
                  ...job.stageUpdates.map((u) => ({
                    id: u.id,
                    at: u.createdAt,
                    label: `Stage updated to ${formatJobStage(u.stage)} (${u.progress}%)`,
                  })),
                ]
                  .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
                  .map((entry) => (
                    <li key={entry.id} className="flex gap-2 text-wraptors-muted">
                      <span className="shrink-0">{formatDateTime(entry.at)}</span>
                      <span>{entry.label}</span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
