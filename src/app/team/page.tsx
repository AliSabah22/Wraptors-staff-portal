"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useJobsStore, useTeamStore } from "@/stores";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, UserPlus } from "lucide-react";
import type { StaffUser } from "@/types";
import { AddTeamMemberModal } from "@/components/team/add-team-member-modal";

function roleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function TeamPage() {
  const jobs = useJobsStore((s) => s.jobs);
  const members = useTeamStore((s) => s.members);
  const removeMember = useTeamStore((s) => s.removeMember);
  const { hasPermission } = usePermissions();
  const canManageTeam = hasPermission("team.manage");
  const [memberToRemove, setMemberToRemove] = useState<StaffUser | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const handleConfirmRemove = () => {
    if (memberToRemove) {
      removeMember(memberToRemove.id);
      setMemberToRemove(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Team</h1>
          <p className="text-wraptors-muted mt-0.5">Employees and assignments</p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setAddMemberOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add team member
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => {
          const assignedJobs = jobs.filter(
            (j) => j.assignedTechnicianId === member.id && j.stage !== "ready"
          );
          return (
            <Card key={member.id} className="border-wraptors-border bg-wraptors-charcoal/50">
              <CardHeader className="flex flex-row items-start gap-4">
                <Avatar className="h-12 w-12 border border-wraptors-gold/30">
                  <AvatarFallback className="text-wraptors-gold bg-wraptors-surface">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base text-white">{member.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {roleLabel(member.role)}
                  </Badge>
                  <p className="text-sm text-wraptors-muted mt-1">{member.email}</p>
                </div>
                {canManageTeam && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-wraptors-muted hover:text-red-400 hover:bg-red-500/10 shrink-0"
                    onClick={() => setMemberToRemove(member)}
                    aria-label={`Remove ${member.name} from team`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {member.role === "technician" ? (
                  <p className="text-sm text-wraptors-muted-light">
                    {assignedJobs.length} active job{assignedJobs.length !== 1 ? "s" : ""}
                  </p>
                ) : (
                  <p className="text-sm text-wraptors-muted">—</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AddTeamMemberModal open={addMemberOpen} onOpenChange={setAddMemberOpen} />

      <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent className="border-wraptors-border bg-wraptors-surface max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Remove from team
            </DialogTitle>
            <DialogDescription>
              {memberToRemove && (
                <>
                  <span className="text-white font-medium">{memberToRemove.name}</span> will be removed from the team roster.
                  They will no longer appear in this list. This does not affect their login or assignments elsewhere.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove from team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
