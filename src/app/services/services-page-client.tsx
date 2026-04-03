"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useServicesStore } from "@/stores";
import { useRole } from "@/hooks/useRole";
import type { Service } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Package, Plus, Trash2 } from "lucide-react";
import { AddServiceModal } from "@/components/services/add-service-modal";

export function ServicesPageClient({ initialServices }: { initialServices: Service[] }) {
  const setServices = useServicesStore((s) => s.setServices);
  const removeService = useServicesStore((s) => s.removeService);
  const { can } = useRole();
  const canDeleteService = can("services.delete");
  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const services = useServicesStore((s) => s.services);

  const closeDeleteDialog = () => {
    if (deleteSubmitting) return;
    setPendingDelete(null);
    setDeleteError(null);
  };

  const confirmDeleteService = async () => {
    if (!pendingDelete) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const res = await fetch(
        `/api/services/${encodeURIComponent(pendingDelete.id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || json.success === false) {
        setDeleteError(
          typeof json.error === "string"
            ? json.error
            : "Could not remove service."
        );
        return;
      }
      removeService(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setDeleteError("Network error — please try again.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices, setServices]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-wraptors-muted mt-0.5">
            Shop services and estimated pricing
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add service
        </Button>
      </div>

      {services.length === 0 ? (
        <Card className="border-wraptors-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wraptors-gold/10 text-wraptors-gold mb-4">
              <Package className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-white">No services yet</h3>
            <p className="text-sm text-wraptors-muted mt-1 max-w-sm">
              Add your first service to use it in quotes and jobs.
            </p>
            <Button className="mt-6 gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className="border-wraptors-border">
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wraptors-gold/20 text-wraptors-gold">
                  <Package className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {canDeleteService && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-wraptors-muted hover:text-red-400"
                      disabled={deleteSubmitting}
                      aria-label={`Remove ${s.name}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setPendingDelete(s);
                        setDeleteError(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {s.active && (
                    <Badge variant="success" className="text-xs">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">{s.name}</CardTitle>
                <p className="text-sm text-wraptors-muted mt-1">{s.description}</p>
                <p className="text-wraptors-gold font-semibold mt-3">
                  {formatCurrency(s.estimatedPrice)} est.
                </p>
                {s.estimatedHours != null && (
                  <p className="text-xs text-wraptors-muted mt-0.5">
                    ~{s.estimatedHours} hrs
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddServiceModal open={addOpen} onOpenChange={setAddOpen} />

      <Dialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <DialogContent
          className="border-wraptors-border bg-wraptors-surface"
          showClose={!deleteSubmitting}
          onPointerDownOutside={(e) => {
            if (deleteSubmitting) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (deleteSubmitting) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Remove service?</DialogTitle>
            <DialogDescription>
              {pendingDelete ? (
                <>
                  Remove <span className="text-white font-medium">“{pendingDelete.name}”</span>{" "}
                  from your services list. This cannot be undone.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-red-400 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2">
              {deleteError}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={deleteSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmDeleteService()}
              disabled={deleteSubmitting}
              className="gap-2"
            >
              {deleteSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remove service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
