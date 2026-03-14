"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">New customer</h1>
      </div>
      <p className="text-wraptors-muted">
        Form placeholder — integrate with React Hook Form + Zod and customers store for production.
      </p>
    </div>
  );
}
