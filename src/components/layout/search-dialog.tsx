"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUIStore, useCustomersStore, useJobsStore } from "@/stores";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchDialog() {
  const searchOpen = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const customers = useCustomersStore((s) => s.customers);
  const jobs = useJobsStore((s) => s.jobs);

  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { customers: [], jobs: [] };
    return {
      customers: customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      ),
      jobs: jobs.filter(
        (j) =>
          j.id.toLowerCase().includes(q) ||
          customers.some(
            (c) => c.id === j.customerId && c.name.toLowerCase().includes(q)
          )
      ),
    };
  }, [query, customers, jobs]);

  const hasResults =
    results.customers.length > 0 || results.jobs.length > 0;
  const isEmpty = query.trim() && !hasResults;

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="max-w-xl border-wraptors-border bg-wraptors-surface p-0 gap-0">
        <DialogHeader className="border-b border-wraptors-border px-4 py-3">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wraptors-muted" />
            <Input
              placeholder="Search jobs, customers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-wraptors-charcoal border-wraptors-border h-10"
              autoFocus
            />
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[320px]">
          {isEmpty && (
            <div className="px-4 py-8 text-center text-sm text-wraptors-muted">
              No jobs or customers match &quot;{query}&quot;
            </div>
          )}
          {!query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-wraptors-muted">
              Type to search jobs and customers
            </div>
          )}
          {hasResults && (
            <div className="py-2">
              {results.customers.length > 0 && (
                <div className="px-2 pb-2">
                  <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-wraptors-muted">
                    Customers
                  </p>
                  {results.customers.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/customers/${c.id}`}
                      onClick={() => setSearchOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        "hover:bg-wraptors-surface-hover"
                      )}
                    >
                      <User className="h-4 w-4 shrink-0 text-wraptors-gold" />
                      <span className="font-medium text-white">{c.name}</span>
                      <span className="text-wraptors-muted truncate">
                        {c.phone}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              {results.jobs.length > 0 && (
                <div className="px-2 pb-2">
                  <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-wraptors-muted">
                    Jobs
                  </p>
                  {results.jobs.slice(0, 5).map((j) => {
                    const customer = customers.find((c) => c.id === j.customerId);
                    return (
                      <Link
                        key={j.id}
                        href={`/jobs/${j.id}`}
                        onClick={() => setSearchOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          "hover:bg-wraptors-surface-hover"
                        )}
                      >
                        <Briefcase className="h-4 w-4 shrink-0 text-wraptors-gold" />
                        <span className="font-medium text-white">
                          Job {j.id}
                        </span>
                        <span className="text-wraptors-muted truncate">
                          {customer?.name ?? "—"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
