import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ServiceJob, JobStage, JobStageUpdate, JobStatus, JobPriority, JobNote, NoteVisibility } from "@/types";
import { STAGE_PROGRESS } from "@/types";
import { mockJobs } from "@/data/mock";

interface JobsState {
  jobs: ServiceJob[];
  setJobs: (jobs: ServiceJob[]) => void;
  getJobById: (id: string) => ServiceJob | undefined;
  updateJobStage: (jobId: string, stage: JobStage, note?: string, userId?: string) => void;
  setJobStatus: (jobId: string, status: JobStatus) => void;
  setJobPriority: (jobId: string, priority: JobPriority) => void;
  setJobBlocker: (jobId: string, blocked: boolean, reason?: string, userId?: string) => void;
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
      merge: (persisted, current) => ({
        ...current,
        jobs: Array.isArray((persisted as { jobs?: ServiceJob[] }).jobs)
          ? (persisted as { jobs: ServiceJob[] }).jobs
          : current.jobs,
      }),
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as Storage)
      ),
    }
  )
);
