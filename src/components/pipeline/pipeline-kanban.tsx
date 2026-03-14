"use client";

import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Trash2 } from "lucide-react";
import type { PipelineLead, PipelineStage } from "@/types";
import { PIPELINE_LEAD_SOURCE_META } from "@/types";

interface Column {
  id: string;
  title: string;
}

const DELETE_ZONE_ID = "delete-lead";

type PipelineKanbanProps = {
  leads: PipelineLead[];
  columns: Column[];
  onMoveLead: (leadId: string, newStage: PipelineStage) => void;
  /** When provided, shows "Drop here to delete customer" zone. Omit for roles without customers.delete. */
  onDeleteLead?: (lead: PipelineLead) => void;
  onViewProfile?: (lead: PipelineLead) => void;
};

function DropPlaceholder() {
  return (
    <div
      className="min-h-[100px] w-full rounded-lg border-2 border-dashed border-wraptors-gold/50 bg-wraptors-gold/10 flex items-center justify-center"
      aria-hidden
    >
      <span className="text-xs font-medium text-wraptors-gold/80">Drop here</span>
    </div>
  );
}

function DroppableColumn({
  id,
  title,
  leadCount,
  children,
  isDragging,
}: {
  id: string;
  title: string;
  leadCount: number;
  children: React.ReactNode;
  isDragging: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border transition-colors min-h-[300px] ${
        isOver
          ? "border-wraptors-gold/60 bg-wraptors-gold/5"
          : "border-wraptors-border bg-wraptors-charcoal/50"
      }`}
    >
      <div className="border-b border-wraptors-border px-4 py-3">
        <h3 className="font-medium text-wraptors-muted-light">{title}</h3>
        <p className="text-xs text-wraptors-muted mt-0.5">{leadCount} leads</p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3 overflow-y-auto">
        {isDragging && isOver && <DropPlaceholder />}
        {children}
      </div>
    </div>
  );
}

function LeadCardContent({
  lead,
  onViewProfile,
}: {
  lead: PipelineLead;
  onViewProfile?: (lead: PipelineLead) => void;
}) {
  const canViewProfile = !!onViewProfile;

  return (
    <Card className="border-wraptors-border overflow-hidden">
      <CardContent className="p-4">
        {canViewProfile ? (
          <button
            type="button"
            className="font-medium text-white hover:text-wraptors-gold transition-colors block text-left w-full"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(lead);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {lead.name}
          </button>
        ) : (
          <p className="font-medium text-white">{lead.name}</p>
        )}
        {(lead.source === PIPELINE_LEAD_SOURCE_META || lead.formName) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {lead.source === PIPELINE_LEAD_SOURCE_META && (
              <Badge variant="outline" className="text-[10px] border-[#1877F2]/50 text-[#1877F2] bg-[#1877F2]/10">
                Meta Lead Ads
              </Badge>
            )}
            {lead.formName && (
              <span className="text-[10px] text-wraptors-muted">{lead.formName}</span>
            )}
          </div>
        )}
        <p className="text-xs text-wraptors-muted mt-0.5">{lead.contact}</p>
        {lead.value != null && (
          <p className="text-sm text-wraptors-gold font-medium mt-2 flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            {formatCurrency(lead.value)}
          </p>
        )}
        {lead.notes && (
          <p className="text-xs text-wraptors-muted mt-2 line-clamp-2">
            {lead.notes}
          </p>
        )}
        {canViewProfile && (
          <button
            type="button"
            className="text-xs text-wraptors-gold hover:text-wraptors-gold-light mt-2 inline-block text-left"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(lead);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            View profile →
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function DraggableLeadCard({
  lead,
  onViewProfile,
}: {
  lead: PipelineLead;
  onViewProfile?: (lead: PipelineLead) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: lead.id,
    data: { lead, type: "lead" },
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
      <LeadCardContent lead={lead} onViewProfile={onViewProfile} />
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

export function PipelineKanban({
  leads,
  columns,
  onMoveLead,
  onDeleteLead,
  onViewProfile,
}: PipelineKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const showDeleteZone = !!onDeleteLead;

  const leadsByColumn = useMemo(() => {
    const map: Record<string, PipelineLead[]> = {};
    columns.forEach((col) => {
      map[col.id] = leads.filter((l) => l.stage === col.id);
    });
    return map;
  }, [leads, columns]);

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
    const leadId = active.id as string;
    const lead = leads.find((l) => l.id === leadId);
    setActiveId(null);

    if (!over) return;

    if (over.id === DELETE_ZONE_ID && lead && onDeleteLead) {
      onDeleteLead(lead);
      return;
    }

    const newStage = over.id as string;
    if (!lead || lead.stage === newStage) return;

    const isValidStage = columns.some((c) => c.id === newStage);
    if (!isValidStage) return;

    onMoveLead(leadId, newStage as PipelineStage);
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

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
            leadCount={leadsByColumn[col.id]?.length ?? 0}
            isDragging={!!activeId}
          >
            {(leadsByColumn[col.id] ?? []).map((lead) => (
              <DraggableLeadCard
                key={lead.id}
                lead={lead}
                onViewProfile={onViewProfile}
              />
            ))}
          </DroppableColumn>
        ))}
      </div>

      {showDeleteZone && <DeleteDropZone isDragging={!!activeId} />}

      <DragOverlay dropAnimation={null}>
        {activeLead ? (
          <div className="cursor-grabbing rotate-1 shadow-gold-glow ring-2 ring-wraptors-gold/50 rounded-xl w-72 pointer-events-none">
            <LeadCardContent lead={activeLead} onViewProfile={onViewProfile} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
