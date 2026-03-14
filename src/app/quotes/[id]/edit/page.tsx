"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QuoteBuilderSteps } from "@/components/quotes/quote-builder-steps";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useQuoteBuilderStore } from "@/stores/quote-builder";

export default function EditQuotePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const getQuoteById = useQuoteBuilderStore((s) => s.getQuoteById);
  const quote = getQuoteById(id);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-wraptors-surface-hover rounded animate-pulse" />
        <div className="h-96 bg-wraptors-surface rounded animate-pulse" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-6">
        <p className="text-wraptors-muted">Quote not found.</p>
        <Button asChild variant="outline">
          <Link href="/quotes">Back to Quotes</Link>
        </Button>
      </div>
    );
  }

  if (quote.status !== "draft") {
    return (
      <div className="space-y-6">
        <p className="text-wraptors-muted">This quote can no longer be edited (status: {quote.status}).</p>
        <Button asChild variant="outline">
          <Link href={`/quotes/${id}`}>View Quote</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/quotes/${id}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Quote — {quote.quoteNumber}</h1>
          <p className="text-wraptors-muted mt-0.5">
            Update services, add-ons, discount, or notes
          </p>
        </div>
      </div>
      <QuoteBuilderSteps mode="edit" existingQuoteId={id} />
    </motion.div>
  );
}
