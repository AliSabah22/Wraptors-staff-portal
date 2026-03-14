"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  MouseSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragOverlay,
  pointerWithin,
} from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { isStandardPriority, JOB_PRIORITY_LABELS } from "@/lib/job-workflow/config";
import { GripVertical, Trash2 } from "lucide-react";
import type { JobStage, JobPriority } from "@/types";

const DELETE_ZONE_ID = "delete-job";

interface JobWithDetails {
  id: string;
  customerId: string;
  customerName: string;
  vehicleLabel: string;
  serviceName: string;
  technicianName: string;
  stage: JobStage;
  progress: number;
  dueDate: string;
  priority?: string;
  isBlocked?: boolean;
}

interface Column {
  id: string;
  title: string;
}

type JobsKanbanProps = {
  jobs: JobWithDetails[];
  columns: Column[];
  onMoveJob: (jobId: string, newStage: JobStage) => void;
  /** When provided, shows "Drop here to delete customer" zone and calls this on drop. Omit for roles without customers.delete. */
  onDeleteCustomer?: (customerId: string, customerName: string) => void;
};

function DropPlaceholder() {
  return (
    <div
      className="min-h-[120px] w-full rounded-lg border-2 border-dashed border-wraptors-gold/50 bg-wraptors-gold/10 flex items-center justify-center"
      aria-hidden
    >
      <span className="text-xs font-medium text-wraptors-gold/80">Drop here</span>
    </div>
  );
}

function DroppableColumn({
  id,
  title,
  jobCount,
  children,
  isDragging,
}: {
  id: string;
  title: string;
  jobCount: number;
  children: React.ReactNode;
  isDragging: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border transition-colors min-h-[400px] ${
        isOver
          ? "border-wraptors-gold/60 bg-wraptors-gold/5"
          : "border-wraptors-border bg-wraptors-charcoal/50"
      }`}
    >
      <div className="border-b border-wraptors-border px-4 py-3">
        <h3 className="font-medium text-wraptors-muted-light">{title}</h3>
        <p className="text-xs text-wraptors-muted mt-0.5">{jobCount} jobs</p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3 overflow-y-auto">
        {isDragging && isOver && <DropPlaceholder />}
        {children}
      </div>
    </div>
  );
}

function JobCardContent({ job, showHandle = true }: { job: JobWithDetails; showHandle?: boolean }) {
  return (
    <Card className="border-wraptors-border overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-start gap-2 p-4">
          {showHandle && (
            <div
              className="mt-0.5 shrink-0 rounded p-1 text-wraptors-muted hover:bg-wraptors-surface-hover hover:text-wraptors-gold cursor-grab active:cursor-grabbing"
              aria-label="Drag to move stage"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-medium text-white truncate">{job.customerName}</p>
              {!isStandardPriority(job.priority) && (
                <Badge variant="outline" className="text-[10px] border-wraptors-gold/50 text-wraptors-gold shrink-0">
                  {job.priority ? (JOB_PRIORITY_LABELS[job.priority as JobPriority] ?? job.priority) : ""}
                </Badge>
              )}
              {job.isBlocked && (
                <Badge variant="destructive" className="text-[10px] shrink-0">Blocked</Badge>
              )}
            </div>
            <p className="text-sm text-wraptors-muted truncate mt-0.5">
              {job.vehicleLabel}
            </p>
            <p className="text-xs text-wraptors-gold mt-1">{job.serviceName}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Progress value={job.progress} className="h-1.5 flex-1" />
              <span className="text-xs text-wraptors-muted shrink-0">
                {job.progress}%
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-wraptors-muted">
                {job.technicianName}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {formatDate(job.dueDate)}
              </Badge>
            </div>
            {showHandle && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8 text-wraptors-gold hover:text-wraptors-gold-light -ml-2"
                asChild
              >
                <Link href={`/jobs/${job.id}`} onClick={(e) => e.stopPropagation()}>
                  View job →
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DraggableJobCard({ job }: { job: JobWithDetails }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: job.id,
    data: { job, type: "job" },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing touch-none ${isDragging ? "opacity-0" : ""}`}
    >
      <JobCardContent job={job} showHandle={true} />
    </div>
  );
}

function DeleteDropZone({ isDragging }: { isDragging: boolean }) {
  const { isOver, setNodeRef } = useDroppable({ id: DELETE_ZONE_ID });

  if (!isDragging) return null;

  return (
    <div
      ref={setNodeRef}
      className={`mt-4 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 transition-all ${
        isOver ? "border-red-500 bg-red-500/20" : "border-red-400/80 bg-red-500/10"
      }`}
    >
      <Trash2 className="h-5 w-5 text-red-400" />
      <span className="text-sm font-medium text-red-400/90">
        Drop here to delete customer
      </span>
    </div>
  );
}

export function JobsKanban({ jobs, columns, onMoveJob, onDeleteCustomer }: JobsKanbanProps) {
  const showDeleteZone = !!onDeleteCustomer;
  const [activeId, setActiveId] = useState<string | null>(null);

  const jobsByColumn = useMemo(() => {
    const map: Record<string, JobWithDetails[]> = {};
    columns.forEach((col) => {
      map[col.id] = jobs.filter((j) => j.stage === col.id);
    });
    return map;
  }, [jobs, columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const jobId = active.id as string;
    const job = jobs.find((j) => j.id === jobId);
    setActiveId(null);

    if (!over) return;

    if (over.id === DELETE_ZONE_ID && job && onDeleteCustomer) {
      onDeleteCustomer(job.customerId, job.customerName);
      return;
    }

    const newStage = over.id as string;
    if (!job || job.stage === newStage) return;

    const isValidStage = columns.some((c) => c.id === newStage);
    if (!isValidStage) return;

    onMoveJob(jobId, newStage as JobStage);
  };

  const activeJob = activeId ? jobs.find((j) => j.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <DroppableColumn
            key={col.id}
            id={col.id}
            title={col.title}
            jobCount={jobsByColumn[col.id]?.length ?? 0}
            isDragging={!!activeId}
          >
            {(jobsByColumn[col.id] ?? []).map((job) => (
              <DraggableJobCard key={job.id} job={job} />
            ))}
          </DroppableColumn>
        ))}
      </div>

      {showDeleteZone && <DeleteDropZone isDragging={!!activeId} />}

      <DragOverlay dropAnimation={null}>
        {activeJob ? (
          <div className="cursor-grabbing rotate-1 shadow-gold-glow ring-2 ring-wraptors-gold/50 rounded-xl pointer-events-none">
            <JobCardContent job={activeJob} showHandle={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
