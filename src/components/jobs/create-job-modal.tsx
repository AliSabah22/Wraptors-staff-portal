"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { useCustomersStore, useJobsStore, useVehiclesStore, useServicesStore, useTeamStore } from "@/stores";
import { createCustomerSchema, type CreateCustomerFormValues } from "@/lib/validations";
import { SHOP_ID } from "@/lib/constants";
import type { Customer, ServiceJob, Vehicle } from "@/types";
import { STAGE_PROGRESS } from "@/types";
import type { JobPriority } from "@/types";
import { Check, Briefcase, UserPlus, User, UserCog } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";

const UNASSIGNED_VALUE = "__none__";

type CreateJobModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Step = "choose" | "new_client" | "existing_client" | "job_params";

export function CreateJobModal({ open, onOpenChange }: CreateJobModalProps) {
  const [step, setStep] = useState<Step>("choose");
  const [clientType, setClientType] = useState<"new" | "existing" | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const addCustomer = useCustomersStore((s) => s.addCustomer);
  const addVehicleToCustomer = useCustomersStore((s) => s.addVehicleToCustomer);
  const addJob = useJobsStore((s) => s.addJob);
  const addVehicle = useVehiclesStore((s) => s.addVehicle);
  const addJobToVehicle = useVehiclesStore((s) => s.addJobToVehicle);
  const customers = useCustomersStore((s) => s.customers);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const services = useServicesStore((s) => s.services).filter((s) => s.active);
  const teamMembers = useTeamStore((s) => s.members);
  const technicians = useMemo(
    () => teamMembers.filter((m) => m.role === "technician"),
    [teamMembers]
  );

  const customerForm = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  const [jobServiceId, setJobServiceId] = useState("");
  const [jobDueDate, setJobDueDate] = useState(() =>
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [jobScheduledStartDate, setJobScheduledStartDate] = useState<string | undefined>(undefined);
  const [jobPickupTargetTime, setJobPickupTargetTime] = useState<string | undefined>(undefined);
  const [jobNotes, setJobNotes] = useState("");
  const [assignedTechnicianId, setAssignedTechnicianId] = useState(UNASSIGNED_VALUE);
  const [jobPriority, setJobPriority] = useState<JobPriority>("standard");
  const [jobParamsError, setJobParamsError] = useState("");

  const resetAll = () => {
    setStep("choose");
    setClientType(null);
    setCustomerId(null);
    setVehicleId(null);
    setCreatedCustomerId(null);
    setSuccessId(null);
    customerForm.reset();
    setJobServiceId("");
    setJobDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setJobScheduledStartDate(undefined);
    setJobPickupTargetTime(undefined);
    setJobNotes("");
    setAssignedTechnicianId(UNASSIGNED_VALUE);
    setJobPriority("standard");
    setJobParamsError("");
  };

  const handleClose = (open: boolean) => {
    if (!open) resetAll();
    onOpenChange(open);
  };

  const onNewClientSubmit = (data: CreateCustomerFormValues) => {
    const ts = Date.now();
    const now = new Date().toISOString();
    const id = `cust_${ts}`;
    const customer: Customer = {
      id,
      shopId: SHOP_ID,
      name: `${data.firstName.trim()} ${data.lastName.trim()}`,
      phone: data.phone.trim(),
      email: data.email?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      vehicleIds: [],
      totalSpend: 0,
      createdAt: now,
      updatedAt: now,
    };
    addCustomer(customer);

    // Create placeholder vehicle in store so job has a real vehicle record
    const vid = `veh_new_${ts}`;
    const vehicle: Vehicle = {
      id: vid,
      shopId: SHOP_ID,
      customerId: id,
      make: "—",
      model: "—",
      year: new Date().getFullYear(),
      serviceJobIds: [],
      createdAt: now,
      updatedAt: now,
    };
    addVehicle(vehicle);
    addVehicleToCustomer(id, vid);

    setCreatedCustomerId(id);
    setCustomerId(id);
    setVehicleId(vid);
    setStep("job_params");
  };

  const vehiclesForCustomer = useMemo(
    () => (customerId ? vehicles.filter((v) => v.customerId === customerId) : []),
    [customerId, vehicles]
  );

  const createJob = () => {
    if (!customerId || !vehicleId) return;
    const err = !jobServiceId
      ? "Select a service"
      : !jobDueDate
        ? "Due date is required"
        : "";
    if (err) {
      setJobParamsError(err);
      return;
    }
    setJobParamsError("");

    const now = new Date().toISOString();
    const jobId = `job_${Date.now()}`;
    const intakeProgress = STAGE_PROGRESS.intake;
    const job: ServiceJob = {
      id: jobId,
      shopId: SHOP_ID,
      customerId,
      vehicleId,
      serviceId: jobServiceId,
      stage: "intake",
      progress: intakeProgress,
      status: "active",
      priority: jobPriority,
      ...(assignedTechnicianId && assignedTechnicianId !== UNASSIGNED_VALUE ? { assignedTechnicianId } : {}),
      dueDate: jobDueDate,
      ...(jobScheduledStartDate ? { scheduledStartDate: jobScheduledStartDate } : {}),
      ...(jobPickupTargetTime ? { pickupTargetTime: jobPickupTargetTime } : {}),
      stageUpdates: [
        {
          id: `update_${jobId}_intake`,
          jobId,
          stage: "intake",
          progress: intakeProgress,
          createdAt: now,
          createdBy: "staff_1",
        },
      ],
      notes: jobNotes ? [jobNotes] : [],
      mediaIds: [],
      createdAt: now,
      updatedAt: now,
    };
    addJob(job);
    addJobToVehicle(vehicleId, jobId);
    setSuccessId(jobId);
  };

  const selectedCustomer = customerId ? customers.find((c) => c.id === customerId) : null;

  if (!open) return null;

  const showSuccess = successId != null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-wraptors-border bg-wraptors-surface">
        {showSuccess ? (
          <>
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wraptors-gold/20 text-wraptors-gold">
                <Check className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center">Job created</DialogTitle>
              <DialogDescription className="text-center">
                The job is in Active Jobs under Intake. You can assign a technician and move it through stages.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-center pt-4">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Done
              </Button>
              <Button asChild>
                <a href="/jobs">View Active Jobs</a>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-wraptors-gold" />
                Create new job
              </DialogTitle>
              <DialogDescription>
                {step === "choose" && "Choose whether this job is for a new or existing client."}
                {step === "new_client" && "Enter the new client details."}
                {step === "existing_client" && "Select the customer and vehicle, then set job details."}
                {step === "job_params" && "Set service, assignment, scheduling (start, due, pickup), and notes for the job."}
              </DialogDescription>
            </DialogHeader>

            {step === "choose" && (
              <div className="flex flex-col gap-3 py-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto flex items-center gap-3 justify-start py-4"
                  onClick={() => {
                    setClientType("new");
                    setStep("new_client");
                  }}
                >
                  <UserPlus className="h-5 w-5 text-wraptors-gold" />
                  <div className="text-left">
                    <p className="font-medium">New client</p>
                    <p className="text-xs text-wraptors-muted">Create a new customer, then add the job</p>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto flex items-center gap-3 justify-start py-4"
                  onClick={() => {
                    setClientType("existing");
                    setStep("existing_client");
                  }}
                >
                  <User className="h-5 w-5 text-wraptors-gold" />
                  <div className="text-left">
                    <p className="font-medium">Existing customer</p>
                    <p className="text-xs text-wraptors-muted">Select a customer and create the job</p>
                  </div>
                </Button>
              </div>
            )}

            {step === "new_client" && (
              <form onSubmit={customerForm.handleSubmit(onNewClientSubmit)} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First name</Label>
                    <Input
                      placeholder="James"
                      {...customerForm.register("firstName")}
                      className="bg-wraptors-charcoal border-wraptors-border"
                    />
                    {customerForm.formState.errors.firstName && (
                      <p className="text-xs text-red-400">{customerForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Last name</Label>
                    <Input
                      placeholder="Smith"
                      {...customerForm.register("lastName")}
                      className="bg-wraptors-charcoal border-wraptors-border"
                    />
                    {customerForm.formState.errors.lastName && (
                      <p className="text-xs text-red-400">{customerForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    {...customerForm.register("phone")}
                    className="bg-wraptors-charcoal border-wraptors-border"
                  />
                  {customerForm.formState.errors.phone && (
                    <p className="text-xs text-red-400">{customerForm.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email (optional)</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    {...customerForm.register("email")}
                    className="bg-wraptors-charcoal border-wraptors-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Notes…"
                    rows={2}
                    {...customerForm.register("notes")}
                    className="bg-wraptors-charcoal border-wraptors-border resize-none"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setStep("choose")}>
                    Back
                  </Button>
                  <Button type="submit" disabled={customerForm.formState.isSubmitting}>
                    Continue to job details
                  </Button>
                </DialogFooter>
              </form>
            )}

            {step === "existing_client" && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <select
                    value={customerId ?? ""}
                    onChange={(e) => {
                      const id = e.target.value || null;
                      setCustomerId(id);
                      setVehicleId(null);
                    }}
                    className="flex h-10 w-full rounded-lg border border-wraptors-border bg-wraptors-charcoal px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-wraptors-gold/50"
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.phone}
                      </option>
                    ))}
                  </select>
                </div>
                {customerId && (
                  <div className="space-y-2">
                    <Label>Vehicle</Label>
                    <select
                      value={vehicleId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setVehicleId(v === "" ? null : v);
                      }}
                      className="flex h-10 w-full rounded-lg border border-wraptors-border bg-wraptors-charcoal px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-wraptors-gold/50"
                    >
                      <option value="">Select vehicle</option>
                      {vehiclesForCustomer.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.year} {v.make} {v.model}
                        </option>
                      ))}
                      <option value="__new__">New vehicle (placeholder)</option>
                    </select>
                    {vehiclesForCustomer.length === 0 && (
                      <p className="text-xs text-wraptors-muted">
                        No vehicles on file. Use &quot;New vehicle (placeholder)&quot; and add details later.
                      </p>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setStep("choose")}>
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (!customerId) return;
                      let vid = vehicleId;
                      if (!vid || vid === "__new__") {
                        const now = new Date().toISOString();
                        vid = `veh_new_${Date.now()}`;
                        const vehicle: Vehicle = {
                          id: vid,
                          shopId: SHOP_ID,
                          customerId,
                          make: "—",
                          model: "—",
                          year: new Date().getFullYear(),
                          serviceJobIds: [],
                          createdAt: now,
                          updatedAt: now,
                        };
                        addVehicle(vehicle);
                        addVehicleToCustomer(customerId, vid);
                        setVehicleId(vid);
                      }
                      setStep("job_params");
                    }}
                    disabled={!customerId}
                  >
                    Continue to job details
                  </Button>
                </DialogFooter>
              </div>
            )}

            {step === "job_params" && (
              <div className="space-y-4 py-2">
                {selectedCustomer && (
                  <p className="text-sm text-wraptors-muted">
                    Job for <span className="text-white font-medium">{selectedCustomer.name}</span>
                  </p>
                )}
                <div className="space-y-2">
                  <Label>Service</Label>
                  <select
                    value={jobServiceId}
                    onChange={(e) => setJobServiceId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-wraptors-border bg-wraptors-charcoal px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-wraptors-gold/50"
                  >
                    <option value="">Select service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-wraptors-gold" />
                    Assign to technician
                  </Label>
                  <Select value={assignedTechnicianId} onValueChange={setAssignedTechnicianId}>
                    <SelectTrigger className="border-wraptors-border bg-wraptors-charcoal text-white">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                      {technicians.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scheduled start</Label>
                  <DateTimePicker
                    value={jobScheduledStartDate}
                    onChange={(v) => setJobScheduledStartDate(v)}
                    placeholder="Select start date & time"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <DatePicker
                    value={jobDueDate || undefined}
                    onChange={(v) => setJobDueDate(v ?? "")}
                    placeholder="Select due date"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pickup target</Label>
                  <DateTimePicker
                    value={jobPickupTargetTime}
                    onChange={(v) => setJobPickupTargetTime(v)}
                    placeholder="Select pickup date & time"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={jobPriority} onValueChange={(v) => setJobPriority(v as JobPriority)}>
                    <SelectTrigger className="border-wraptors-border bg-wraptors-charcoal text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="rush">Rush</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Job notes…"
                    rows={2}
                    value={jobNotes}
                    onChange={(e) => setJobNotes(e.target.value)}
                    className="bg-wraptors-charcoal border-wraptors-border resize-none"
                  />
                </div>
                {jobParamsError && (
                  <p className="text-xs text-red-400">{jobParamsError}</p>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (clientType === "new") {
                        setStep("new_client");
                        setCreatedCustomerId(null);
                        setCustomerId(null);
                        setVehicleId(null);
                      } else {
                        setStep("existing_client");
                      }
                    }}
                  >
                    Back
                  </Button>
                  <Button onClick={createJob}>
                    Create job (Intake)
                  </Button>
                </DialogFooter>
              </div>
            )}

          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
