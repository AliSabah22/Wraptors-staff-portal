"use client";

import { useEffect, useState } from "react";
import { TechnicianDashboard } from "@/components/dashboard/technician-dashboard";

export default function MyJobsDashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <TechnicianDashboard />
  );
}
