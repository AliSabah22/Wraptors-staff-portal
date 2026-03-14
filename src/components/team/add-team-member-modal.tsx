"use client";

import { useState } from "react";
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
import { useTeamStore } from "@/stores";
import { SHOP_ID } from "@/lib/constants";
import { STAFF_ROLES, getRoleLabel } from "@/lib/auth/roles";
import type { StaffUser } from "@/types";
import type { StaffRoleCode } from "@/lib/auth/roles";
import { registerMockStaff } from "@/data/auth-mock";
import { MOCK_STAFF_PASSWORD } from "@/data/auth-mock";
import { Check, Copy, Loader2, UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AddTeamMemberModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddTeamMemberModal({ open, onOpenChange }: AddTeamMemberModalProps) {
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRoleCode>("technician");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const addMember = useTeamStore((s) => s.addMember);
  const hasMemberWithEmail = useTeamStore((s) => s.hasMemberWithEmail);

  const credentialsText =
    success && email
      ? `Email: ${email.trim().toLowerCase()}\nPassword: ${MOCK_STAFF_PASSWORD}`
      : "";

  const handleCopyCredentials = async () => {
    if (!credentialsText) return;
    try {
      await navigator.clipboard.writeText(credentialsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSuccess(false);
      setName("");
      setEmail("");
      setRole("technician");
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }
    if (hasMemberWithEmail(trimmedEmail)) {
      setError("A team member with this email already exists.");
      return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    const id = `staff_${Date.now()}`;
    const newMember: StaffUser = {
      id,
      shopId: SHOP_ID,
      email: trimmedEmail,
      name: trimmedName,
      role,
      createdAt: now,
      updatedAt: now,
    };
    const result = addMember(newMember);
    if (!result.added) {
      setError(
        result.reason === "duplicate_email"
          ? "A team member with this email already exists."
          : "A team member with this ID already exists. Please try again."
      );
      setSubmitting(false);
      return;
    }
    registerMockStaff({ user: newMember, password: MOCK_STAFF_PASSWORD });
    setSuccess(true);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-wraptors-border bg-wraptors-surface">
        {success ? (
          <>
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wraptors-gold/20 text-wraptors-gold">
                <Check className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center text-white">Team member added</DialogTitle>
              <DialogDescription className="text-center">
                Give these login credentials to the employee so they can sign in. Share securely (e.g. in person or over a secure channel).
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 p-4 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-wraptors-muted">Login credentials</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-wraptors-muted">Email</span>
                  <span className="font-mono text-white break-all">{email.trim().toLowerCase()}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-wraptors-muted">Password</span>
                  <span className="font-mono text-wraptors-gold">{MOCK_STAFF_PASSWORD}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2 border-wraptors-gold/50 text-wraptors-gold hover:bg-wraptors-gold/10"
                onClick={handleCopyCredentials}
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied to clipboard" : "Copy credentials"}
              </Button>
            </div>
            <DialogFooter className="flex gap-2 sm:justify-center pt-4">
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <UserPlus className="h-5 w-5 text-wraptors-gold" />
                Add team member
              </DialogTitle>
              <DialogDescription>
                Add a new employee to the team roster. After saving, you’ll get login credentials to give to them.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="team-member-name" className="text-wraptors-muted-light">
                  Full name
                </Label>
                <Input
                  id="team-member-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Blake"
                  className="border-wraptors-border bg-wraptors-charcoal text-white placeholder:text-wraptors-muted"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-member-email" className="text-wraptors-muted-light">
                  Email (login)
                </Label>
                <Input
                  id="team-member-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@wraptors.com"
                  className="border-wraptors-border bg-wraptors-charcoal text-white placeholder:text-wraptors-muted"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-wraptors-muted-light">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as StaffRoleCode)}>
                  <SelectTrigger className="border-wraptors-border bg-wraptors-charcoal text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {getRoleLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <DialogFooter className="gap-2 pt-4 border-t border-wraptors-border/50">
                <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Add team member
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
