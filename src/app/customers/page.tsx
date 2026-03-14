"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCustomersStore } from "@/stores";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Phone, Mail } from "lucide-react";
import { AddCustomerModal } from "@/components/customers/add-customer-modal";

function CustomersContent() {
  const [addOpen, setAddOpen] = useState(false);
  const customers = useCustomersStore((s) => s.customers) ?? [];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-wraptors-muted mt-0.5">
            {customers.length} total customer{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <Card className="border-wraptors-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wraptors-gold/10 text-wraptors-gold mb-4">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-white">No customers yet</h3>
            <p className="text-sm text-wraptors-muted mt-1 max-w-sm">
              Add your first customer to start building your client list.
            </p>
            <Button className="mt-6 gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card className="hover:border-wraptors-gold/50 transition-colors h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-wraptors-gold/20 text-wraptors-gold">
                      <Users className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium text-wraptors-gold">
                      {c.vehicleIds?.length ?? 0} vehicle{(c.vehicleIds?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mt-4">{c.name}</h3>
                  <p className="text-sm text-wraptors-muted flex items-center gap-1.5 mt-1">
                    <Phone className="h-3.5 w-3.5" /> {c.phone}
                  </p>
                  {c.email && (
                    <p className="text-sm text-wraptors-muted flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3.5 w-3.5" /> {c.email}
                    </p>
                  )}
                  <p className="text-sm text-wraptors-gold font-medium mt-3">
                    Total spend: {formatCurrency(c.totalSpend ?? 0)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <AddCustomerModal open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}

export default function CustomersPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
            <p className="text-wraptors-muted mt-0.5">Loading…</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-wraptors-border animate-pulse">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-full bg-wraptors-surface-hover" />
                <div className="mt-4 h-5 w-32 bg-wraptors-surface-hover rounded" />
                <div className="mt-2 h-4 w-48 bg-wraptors-surface-hover rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <CustomersContent />
    </motion.div>
  );
}
