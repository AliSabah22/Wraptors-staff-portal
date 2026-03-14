"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useServicesStore } from "@/stores";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus } from "lucide-react";
import { AddServiceModal } from "@/components/services/add-service-modal";

export default function ServicesPage() {
  const [addOpen, setAddOpen] = useState(false);
  const services = useServicesStore((s) => s.services);

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
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wraptors-gold/20 text-wraptors-gold">
                  <Package className="h-5 w-5" />
                </div>
                {s.active && (
                  <Badge variant="success" className="text-xs">Active</Badge>
                )}
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
    </motion.div>
  );
}
