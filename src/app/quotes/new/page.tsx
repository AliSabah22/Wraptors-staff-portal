"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { QuoteBuilderSteps } from "@/components/quotes/quote-builder-steps";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function NewQuotePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/quotes">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Quote</h1>
          <p className="text-wraptors-muted mt-0.5">
            Build a professional quote in under 2 minutes
          </p>
        </div>
      </div>
      <QuoteBuilderSteps mode="new" />
    </motion.div>
  );
}
