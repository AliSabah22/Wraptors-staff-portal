import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ServiceJob,
  JobStage,
  JobStageUpdate,
  JobStatus,
  JobPriority,
  JobNote,
  NoteVisibility,
  OperationalBlockRequest,
  BlockRequestDetails,
  BlockTypeKey,
  BlockerHistoryEntry,
} from "@/types";
import { STAGE_PROGRESS } from "@/types";
import { mockJobs } from "@/data/mock";
import { BLOCK_TYPE_LABELS } from "@/lib/job-workflow/config";

/**
 * Jobs that still need scheduling: not completed AND (intake stage OR no technician OR no scheduled start).
 * When both assignedTechnicianId and scheduledStartDate are set → job is excluded:
 * - Dashboard "Needing scheduling" count goes -1 and job is removed from that list.
 * - Calendar "Unscheduled jobs" count goes -1 and that job (customer) is removed from the list.
 */
export function getJobsNeedingSchedulingFilter(job: ServiceJob): boolean {
  return (
    !job.completedAt &&
    (job.stage === "intake" || !job.assignedTechnicianId || !job.scheduledStartDate)
  );
}

interface JobsState {
  jobs: ServiceJob[];
  setJobs: (jobs: ServiceJob[]) => void;
  getJobById: (id: string) => ServiceJob | undefined;
  getJobsNeedingScheduling: () => ServiceJob[];
  updateJobStage: (jobId: string, stage: JobStage, note?: string, userId?: string) => void;
  setJobStatus: (jobId: string, status: JobStatus) => void;
  setJobPriority: (jobId: string, priority: JobPriority) => void;
  setJobBlocker: (jobId: string, blocked: boolean, reason?: string, userId?: string) => void;
  /** Structured block request; notifies via caller. Returns request for notifications/chat. */
  createBlockRequest: (jobId: string, type: BlockTypeKey, details: BlockRequestDetails, requestedBy: string) => OperationalBlockRequest | null;
  /** Resolve a non-approval block. Returns request and technician id for resolution notification. */
  resolveBlockRequest: (jobId: string, resolvedBy: string) => { request: OperationalBlockRequest; technicianUserId: string } | null;
  /** Approve an approval request (CEO). Returns request and technician id for notification. */
  approveApprovalRequest: (jobId: string, approvedBy: string) => { request: OperationalBlockRequest; technicianUserId: string } | null;
  /** Deny an approval request (CEO). Keeps job blocked. Returns request for notification. */
  denyApprovalRequest: (jobId: string, deniedBy: string, denialReason: string) => { request: OperationalBlockRequest; technicianUserId: string } | null;
  setScheduledStartDate: (jobId: string, value: string | undefined) => void;
  setPickupTargetTime: (jobId: string, value: string | undefined) => void;
  setDropOffDate: (jobId: string, value: string | undefined) => void;
  setDueDate: (jobId: string, value: string) => void;
  addJobNote: (jobId: string, note: string, visibility?: NoteVisibility, userId?: string) => void;
  assignTechnician: (jobId: string, technicianId: string | undefined) => void;
  addMediaToJob: (jobId: string, mediaId: string) => void;
  addJob: (job: ServiceJob) => void;
  removeJobsByCustomerId: (customerId: string) => void;
}

export const useJobsStore = create<JobsState>()(
  persist(
    (set, get) => ({
  jobs: mockJobs,

  setJobs: (jobs) => set({ jobs }),

  getJobById: (id) => get().jobs.find((j) => j.id === id),

  getJobsNeedingScheduling: () =>
    get()
      .jobs.filter(getJobsNeedingSchedulingFilter)
      .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime()),

  updateJobStage: (jobId, stage, note, userId = "staff_4") => {
    const progress = STAGE_PROGRESS[stage];
    const update: JobStageUpdate = {
      id: `update_${jobId}_${stage}_${Date.now()}`,
      jobId,
      stage,
      progress,
      note,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              stage,
              progress,
              stageUpdates: [...job.stageUpdates, update],
              updatedAt: new Date().toISOString(),
            }
          : job
      ),
    }));
  },

  setJobStatus: (jobId, status) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? { ...job, status, updatedAt: new Date().toISOString() }
          : job
      ),
    }));
  },

  setJobPriority: (jobId, priority) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? { ...job, priority, updatedAt: new Date().toISOString() }
          : job
      ),
    }));
  },

  setJobBlocker: (jobId, blocked, reason, userId) => {
    const now = new Date().toISOString();
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              isBlocked: blocked,
              blockerReason: blocked ? reason ?? undefined : undefined,
              blockedAt: blocked ? now : undefined,
              blockedBy: blocked ? userId : undefined,
              status: blocked ? "blocked" : (job.status === "blocked" ? "active" : job.status),
              updatedAt: now,
            }
          : job
      ),
    }));
  },

  createBlockRequest: (jobId, type, details, requestedBy) => {
    const now = new Date().toISOString();
    const request: OperationalBlockRequest = {
      id: `block_${jobId}_${Date.now()}`,
      jobId,
      type,
      requestedBy,
      requestedAt: now,
      status: "pending",
      details,
    };
    const label = BLOCK_TYPE_LABELS[type];
    const historyEntry: BlockerHistoryEntry = {
      id: `bh_${jobId}_${Date.now()}`,
      jobId,
      kind: "blocker_requested",
      blockType: type,
      requestedBy,
      details,
      createdAt: now,
    };
    let created: OperationalBlockRequest | null = null;
    set((state) => ({
      jobs: state.jobs.map((job) => {
        if (job.id !== jobId) return job;
        created = request;
        return {
          ...job,
          isBlocked: true,
          blockerReason: label,
          blockedAt: now,
          blockedBy: requestedBy,
          status: "blocked",
          blockerRequest: request,
          blockerHistory: [...(job.blockerHistory ?? []), historyEntry],
          updatedAt: now,
        };
      }),
    }));
    return created;
  },

  resolveBlockRequest: (jobId, resolvedBy) => {
    const now = new Date().toISOString();
    let result: { request: OperationalBlockRequest; technicianUserId: string } | null = null;
    set((state) => ({
      jobs: state.jobs.map((job) => {
        if (job.id !== jobId || !job.blockerRequest || job.blockerRequest.type === "waiting_for_approval")
          return job;
        const req = { ...job.blockerRequest, status: "resolved" as const, resolvedBy, resolvedAt: now };
        const historyEntry: BlockerHistoryEntry = {
          id: `bh_${jobId}_${Date.now()}`,
          jobId,
          kind: "blocker_resolved",
          blockType: req.type,
          requestedBy: req.requestedBy,
          resolvedBy,
          details: req.details,
          createdAt: now,
        };
        result = { request: req, technicianUserId: req.requestedBy };
        return {
          ...job,
          isBlocked: false,
          blockerReason: undefined,
          blockedAt: undefined,
          blockedBy: undefined,
          status: "active",
          blockerRequest: undefined,
          blockerHistory: [...(job.blockerHistory ?? []), historyEntry],
          updatedAt: now,
        };
      }),
    }));
    return result;
  },

  approveApprovalRequest: (jobId, approvedBy) => {
    const now = new Date().toISOString();
    let result: { request: OperationalBlockRequest; technicianUserId: string } | null = null;
    set((state) => ({
      jobs: state.jobs.map((job) => {
        if (job.id !== jobId || !job.blockerRequest || job.blockerRequest.type !== "waiting_for_approval")
          return job;
        const req = { ...job.blockerRequest, status: "approved" as const, resolvedBy: approvedBy, resolvedAt: now };
        const historyEntry: BlockerHistoryEntry = {
          id: `bh_${jobId}_${Date.now()}`,
          jobId,
          kind: "approval_approved",
          blockType: "waiting_for_approval",
          requestedBy: req.requestedBy,
          resolvedBy: approvedBy,
          details: req.details,
          createdAt: now,
        };
        result = { request: req, technicianUserId: req.requestedBy };
        return {
          ...job,
          isBlocked: false,
          blockerReason: undefined,
          blockedAt: undefined,
          blockedBy: undefined,
          status: "active",
          blockerRequest: undefined,
          blockerHistory: [...(job.blockerHistory ?? []), historyEntry],
          updatedAt: now,
        };
      }),
    }));
    return result;
  },

  denyApprovalRequest: (jobId, deniedBy, denialReason) => {
    const now = new Date().toISOString();
    let result: { request: OperationalBlockRequest; technicianUserId: string } | null = null;
    set((state) => ({
      jobs: state.jobs.map((job) => {
        if (job.id !== jobId || !job.blockerRequest || job.blockerRequest.type !== "waiting_for_approval")
          return job;
        const req = {
          ...job.blockerRequest,
          status: "denied" as const,
          denialReason,
          resolvedBy: deniedBy,
          resolvedAt: now,
        };
        const historyEntry: BlockerHistoryEntry = {
          id: `bh_${jobId}_${Date.now()}`,
          jobId,
          kind: "approval_denied",
          blockType: "waiting_for_approval",
          requestedBy: req.requestedBy,
          resolvedBy: deniedBy,
          denialReason,
          details: req.details,
          createdAt: now,
        };
        result = { request: req, technicianUserId: req.requestedBy };
        return {
          ...job,
          blockerRequest: req,
          blockerHistory: [...(job.blockerHistory ?? []), historyEntry],
          updatedAt: now,
        };
      }),
    }));
    return result;
  },

  setScheduledStartDate: (jobId, value) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? { ...job, scheduledStartDate: value, updatedAt: new Date().toISOString() }
          : job
      ),
    }));
  },

  setPickupTargetTime: (jobId, value) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? { ...job, pickupTargetTime: value, updatedAt: new Date().toISOString() }
          : job
      ),
    }));
  },

  setDropOffDate: (jobId, value) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? { ...job, dropOffDate: value, updatedAt: new Date().toISOString() }
          : job
      ),
    }));
  },

  setDueDate: (jobId, value) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? { ...job, dueDate: value, updatedAt: new Date().toISOString() }
          : job
      ),
    }));
  },

  addJobNote: (jobId, note, visibility = "internal", userId) => {
    const now = new Date().toISOString();
    const jobNote: JobNote = {
      id: `note_${jobId}_${Date.now()}`,
      text: note,
      visibility,
      createdAt: now,
      createdBy: userId,
    };
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              notes: [...job.notes, note],
              jobNotes: [...(job.jobNotes ?? []), jobNote],
              updatedAt: now,
            }
          : job
      ),
    }));
  },

  assignTechnician: (jobId, technicianId) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? { ...job, assignedTechnicianId: technicianId, updatedAt: new Date().toISOString() }
          : job
      ),
    }));
  },

  addMediaToJob: (jobId, mediaId) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              mediaIds: [...job.mediaIds, mediaId],
              updatedAt: new Date().toISOString(),
            }
          : job
      ),
    }));
  },

  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),

  removeJobsByCustomerId: (customerId) =>
    set((state) => ({
      jobs: state.jobs.filter((j) => j.customerId !== customerId),
    })),
}),
    {
      name: "wraptors-jobs",
      partialize: (state) => ({ jobs: state.jobs }),
      merge: (persisted, current) => {
        // Persisted may be partialized state { jobs } or (from some storages) { state: { jobs } }
        const raw = persisted as { jobs?: ServiceJob[]; state?: { jobs?: ServiceJob[] } } | null;
        const persistedJobs = Array.isArray(raw?.jobs)
          ? raw.jobs
          : Array.isArray(raw?.state?.jobs)
            ? raw.state.jobs
            : null;
        return {
          ...current,
          jobs: persistedJobs ?? current.jobs,
        };
      },
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
      ),
    }
  )
);
