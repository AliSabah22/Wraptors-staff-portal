"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, User, Car, Wrench, UserCog, Camera, StickyNote, Check, Trash2, Loader2, AlertTriangle, Save } from "lucide-react";
import { JobThreadPanel } from "@/components/chat/job-thread-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DeleteCustomerOptionsDialog } from "@/components/customers/delete-customer-options-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { useJobsStore, useMediaStore, useTeamStore, useChatStore, useNotificationsStore } from "@/stores";
import { CustomerProfileModal } from "@/components/customers/customer-profile-modal";
import { BlockRequestModal } from "@/components/jobs/block-request-modal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { formatCurrency, formatDate, formatDateTime, formatJobStage } from "@/lib/utils";
import { jobNoteSchema, type JobNoteFormValues } from "@/lib/validations";
import { SHOP_ID } from "@/lib/constants";
import { getAllowedNextStages, stageRequiresPhoto, canTransitionTo } from "@/lib/job-workflow/stage-transitions";
import {
  BLOCKER_REASON_OPTIONS,
  BLOCKER_REASON_PAYMENT_VALUE,
  BLOCK_TYPE_LABELS,
  JOB_STATUS_LABELS,
  JOB_PRIORITY_LABELS,
  RECEPTIONIST_SETTABLE_STATUSES,
  VISIBILITY_OPTIONS,
  REQUIRED_PHOTO_STAGE_MESSAGE,
  isStandardPriority,
} from "@/lib/job-workflow/config";
import {
  buildBlockRequestedNotifications,
  buildTechnicianResolutionNotification,
  toNotificationItem,
} from "@/lib/job-workflow/blocker-notifications";
import {
  RESOLUTION_BUTTON_LABELS,
  getTimelineLabel,
  getChatSystemMessageRequested,
  CHAT_SYSTEM_MESSAGE_RESOLVED,
  getChatSystemMessageApprovalApproved,
  getChatSystemMessageApprovalDenied,
  getBannerDetailLabel,
  getBannerDetailValue,
  getBannerDetailSubline,
} from "@/lib/job-workflow/blocker-copy";
import { getJobNotesForDisplay } from "@/lib/job-notes";
import { jobThreadTitle } from "@/lib/chat/format";
import { getJobThreadParticipantIds } from "@/lib/chat/participants";
import type { ServiceJob, JobStage, JobPriority, JobStatus, BlockTypeKey, BlockRequestDetails } from "@/types";
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
  const createBlockRequest = useJobsStore((s) => s.createBlockRequest);
  const resolveBlockRequest = useJobsStore((s) => s.resolveBlockRequest);
  const approveApprovalRequest = useJobsStore((s) => s.approveApprovalRequest);
  const denyApprovalRequest = useJobsStore((s) => s.denyApprovalRequest);
  const addMedia = useMediaStore((s) => s.addMedia);
  const getMediaById = useMediaStore((s) => s.getById);
  const teamMembers = useTeamStore((s) => s.members);
  const getOrCreateJobThread = useChatStore((s) => s.getOrCreateJobThread);
  const addMessage = useChatStore((s) => s.addMessage);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const [stageSelectOpen, setStageSelectOpen] = useState(false);
  const [blockRequestModalType, setBlockRequestModalType] = useState<BlockTypeKey | null>(null);
  const [denyModalOpen, setDenyModalOpen] = useState(false);
  const [denialReason, setDenialReason] = useState("");
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

  const vehicleServiceSummary = [vehicle?.make, vehicle?.model].filter(Boolean).join(" ") + (service?.name ? ` · ${service.name}` : "");

  const handleBlockRequestSubmit = (details: BlockRequestDetails) => {
    if (!blockRequestModalType || !user?.id) return;
    const request = createBlockRequest(job.id, blockRequestModalType, details, user.id);
    if (!request) return;
    const requestedByName = user.name ?? "Someone";
    const staff = teamMembers;
    const notifs = buildBlockRequestedNotifications(request, requestedByName, vehicleServiceSummary, staff, job.id);
    notifs.forEach((n) => addNotification(toNotificationItem(n)));
    const thread = getOrCreateJobThread(
      job.id,
      jobThreadTitle(vehicle?.make, vehicle?.model, service?.name) || `Job ${job.id}`,
      getJobThreadParticipantIds(staff, job)
    );
    const systemBody = getChatSystemMessageRequested(requestedByName, blockRequestModalType, details);
    addMessage(thread.id, "system", systemBody, { messageType: "system" });
    setBlockRequestModalType(null);
  };

  const handleResolveBlock = () => {
    if (!user?.id) return;
    const result = resolveBlockRequest(job.id, user.id);
    if (!result) return;
    const staffById = new Map(teamMembers.map((m) => [m.id, m.name]));
    const resolvedByName = staffById.get(user.id) ?? "Someone";
    const notif = buildTechnicianResolutionNotification(
      result.request,
      resolvedByName,
      vehicleServiceSummary,
      result.technicianUserId,
      job.id
    );
    if (notif) addNotification(toNotificationItem(notif));
    const thread = getOrCreateJobThread(
      job.id,
      jobThreadTitle(vehicle?.make, vehicle?.model, service?.name) || `Job ${job.id}`,
      getJobThreadParticipantIds(teamMembers, job)
    );
    const msg = CHAT_SYSTEM_MESSAGE_RESOLVED[result.request.type as keyof typeof CHAT_SYSTEM_MESSAGE_RESOLVED] ?? "Block resolved — job unblocked.";
    addMessage(thread.id, "system", msg, { messageType: "system" });
  };

  const handleApproveRequest = () => {
    if (!user?.id) return;
    const result = approveApprovalRequest(job.id, user.id);
    if (!result) return;
    const staffById = new Map(teamMembers.map((m) => [m.id, m.name]));
    const resolvedByName = staffById.get(user.id) ?? "Someone";
    const notif = buildTechnicianResolutionNotification(
      result.request,
      resolvedByName,
      vehicleServiceSummary,
      result.technicianUserId,
      job.id
    );
    if (notif) addNotification(toNotificationItem(notif));
    const thread = getOrCreateJobThread(
      job.id,
      jobThreadTitle(vehicle?.make, vehicle?.model, service?.name) || `Job ${job.id}`,
      getJobThreadParticipantIds(teamMembers, job)
    );
    addMessage(thread.id, "system", getChatSystemMessageApprovalApproved(resolvedByName), { messageType: "system" });
  };

  const handleDenyRequest = () => {
    const trimmed = denialReason.trim();
    if (!user?.id || trimmed.length < 10) return;
    const result = denyApprovalRequest(job.id, user.id, trimmed);
    setDenyModalOpen(false);
    setDenialReason("");
    if (!result) return;
    const staffById = new Map(teamMembers.map((m) => [m.id, m.name]));
    const resolvedByName = staffById.get(user.id) ?? "Someone";
    const notif = buildTechnicianResolutionNotification(
      result.request,
      resolvedByName,
      vehicleServiceSummary,
      result.technicianUserId,
      job.id
    );
    if (notif) addNotification(toNotificationItem(notif));
    const thread = getOrCreateJobThread(
      job.id,
      jobThreadTitle(vehicle?.make, vehicle?.model, service?.name) || `Job ${job.id}`,
      getJobThreadParticipantIds(teamMembers, job)
    );
    addMessage(thread.id, "system", getChatSystemMessageApprovalDenied(result.request.denialReason ?? "", resolvedByName), { messageType: "system" });
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

      {job.isBlocked && (job.blockerRequest || job.blockerReason) && (
        <Card className="border-amber-500/40 bg-wraptors-charcoal/50 overflow-hidden">
          <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="text-sm font-semibold text-amber-200 uppercase tracking-wide">Operational block</span>
            <Badge variant="outline" className="ml-auto border-amber-400/50 text-amber-200 text-xs">
              {job.blockerRequest ? BLOCK_TYPE_LABELS[job.blockerRequest.type] : job.blockerReason}
            </Badge>
          </div>
          <CardContent className="py-4 space-y-4">
            {job.blockerRequest ? (
              <>
                <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-wraptors-muted">Requested by</span>
                    <span className="ml-1.5 text-wraptors-muted-light">
                      {teamMembers.find((m) => m.id === job.blockerRequest!.requestedBy)?.name ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-wraptors-muted">Requested at</span>
                    <span className="ml-1.5 text-wraptors-muted-light">{formatDateTime(job.blockerRequest.requestedAt)}</span>
                  </div>
                  {getBannerDetailValue(job.blockerRequest) && (
                    <div className="sm:col-span-2">
                      <span className="text-wraptors-muted">{getBannerDetailLabel(job.blockerRequest.type)}</span>
                      <span className="ml-1.5 text-wraptors-muted-light">{getBannerDetailValue(job.blockerRequest)}</span>
                    </div>
                  )}
                  {getBannerDetailSubline(job.blockerRequest) && (
                    <div className="sm:col-span-2 text-wraptors-muted-light text-xs">
                      {getBannerDetailSubline(job.blockerRequest)}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-wraptors-border">
                  {job.blockerRequest.type === "waiting_for_approval" && role === "ceo" && (
                    <>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleApproveRequest}>
                        Approve request
                      </Button>
                      <Button size="sm" variant="outline" className="border-amber-400/50 text-amber-200 hover:bg-amber-500/20" onClick={() => setDenyModalOpen(true)}>
                        Deny request
                      </Button>
                    </>
                  )}
                  {job.blockerRequest.type !== "waiting_for_approval" && (role === "receptionist" || role === "ceo") && (
                    <Button size="sm" className="bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold/90" onClick={handleResolveBlock}>
                      {RESOLUTION_BUTTON_LABELS[job.blockerRequest.type]}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-amber-200/90">{job.blockerReason}</p>
                {(hasPermission("jobs.edit_basic") || hasPermission("jobs.update_status")) && (
                  <Button size="sm" variant="outline" className="border-amber-400/50 text-amber-200 hover:bg-amber-500/20" onClick={() => setJobBlocker(job.id, false, undefined, user?.id)}>
                    Clear block
                  </Button>
                )}
              </div>
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
                  <div className="text-sm text-wraptors-muted-light mt-1">
                    <Badge variant="outline">{JOB_STATUS_LABELS[job.status ?? "active"]}</Badge>
                  </div>
                )}
              </div>
              {!job.isBlocked && hasPermission("jobs.update_status") && (
                <div className="flex flex-wrap gap-2">
                  {(role === "technician"
                    ? BLOCKER_REASON_OPTIONS.filter((opt) => opt.value !== BLOCKER_REASON_PAYMENT_VALUE)
                    : BLOCKER_REASON_OPTIONS
                  ).map((opt) => (
                    <Button
                      key={opt.value}
                      variant="outline"
                      size="sm"
                      className="text-amber-400 border-amber-400/50 hover:bg-amber-500/10"
                      onClick={() => setBlockRequestModalType(opt.blockType)}
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

          <JobThreadPanel
            job={job}
            customer={customer}
            vehicle={vehicle}
            service={service}
            currentUserId={user?.id ?? ""}
          />

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
                  ...(job.blockerHistory ?? []).map((h) => {
                    const requestedByName = h.requestedBy ? teamMembers.find((m) => m.id === h.requestedBy)?.name : undefined;
                    const resolvedByName = h.resolvedBy ? teamMembers.find((m) => m.id === h.resolvedBy)?.name : undefined;
                    return {
                      id: h.id,
                      at: h.createdAt,
                      label: getTimelineLabel(h.kind, h.blockType, {
                        requestedByName,
                        resolvedByName,
                        denialReason: h.denialReason,
                      }),
                    };
                  }),
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

      {blockRequestModalType && (
        <BlockRequestModal
          open={!!blockRequestModalType}
          onOpenChange={(open) => !open && setBlockRequestModalType(null)}
          blockType={blockRequestModalType}
          jobId={job.id}
          onSubmit={handleBlockRequestSubmit}
        />
      )}

      <Dialog open={denyModalOpen} onOpenChange={(open) => { if (!open) setDenialReason(""); setDenyModalOpen(open); }}>
        <DialogContent className="border-wraptors-border bg-wraptors-surface max-w-md">
          <DialogHeader>
            <DialogTitle className="text-wraptors-gold">Deny approval request</DialogTitle>
            <DialogDescription className="text-wraptors-muted leading-relaxed">
              The technician will be notified with your reason. A clear reason is required for accountability and so they can address the issue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-wraptors-muted">Reason for denial *</Label>
            <p className="text-xs text-wraptors-muted">Minimum 10 characters. This will be shown to the technician.</p>
            <Textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="e.g. Need more photos of the affected area before approving rework."
              className="min-h-[100px] border-wraptors-border bg-wraptors-black/50 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-wraptors-muted">{denialReason.length}/500</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDenyModalOpen(false)} className="border-wraptors-border">Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-500 text-white"
              onClick={handleDenyRequest}
              disabled={denialReason.trim().length < 10}
            >
              Deny request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
