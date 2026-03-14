import { z } from "zod";

export const jobStageSchema = z.enum([
  "intake",
  "inspection",
  "prep",
  "disassembly",
  "installation",
  "reassembly",
  "inspection_final",
  "media",
  "ready",
]);

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const quoteSourceSchema = z.enum([
  "mobile_app",
  "phone",
  "walk_in",
  "web",
  "in_person",
]);

export const createQuoteSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Phone is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  vehicleColor: z.string().optional(),
  serviceIds: z.array(z.string()).min(1, "Select at least one service"),
  notes: z.string().optional(),
  estimatedAmount: z.coerce.number().min(0).optional(),
  source: quoteSourceSchema.default("walk_in"),
});

export const createServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  estimatedHours: z.coerce.number().min(0).optional(),
  estimatedPriceMin: z.coerce.number().min(0).optional(),
  estimatedPriceMax: z.coerce.number().min(0).optional(),
  estimatedPrice: z.coerce.number().min(0),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export const uploadMediaSchema = z.object({
  title: z.string().optional(),
  caption: z.string().optional(),
  jobId: z.string().optional(),
  customerId: z.string().optional(),
  vehicleId: z.string().optional(),
});

export const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().optional(),
  vin: z.string().optional(),
  plate: z.string().optional(),
});

export const jobNoteSchema = z.object({
  note: z.string().min(1, "Note is required"),
  visibility: z.enum(["internal", "customer_visible"]).default("internal"),
});

export const quoteStatusSchema = z.enum([
  "new",
  "contacted",
  "quoted",
  "negotiating",
  "booked",
  "lost",
]);

export const pipelineStageSchema = z.enum([
  "lead",
  "consultation",
  "quote_sent",
  "follow_up",
  "booked",
  "lost",
]);

export type CustomerFormValues = z.infer<typeof customerSchema>;
export type UpdateCustomerFormValues = z.infer<typeof updateCustomerSchema>;
export type VehicleFormValues = z.infer<typeof vehicleSchema>;
export type JobNoteFormValues = z.infer<typeof jobNoteSchema>;
export type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;
export type CreateQuoteFormValues = z.infer<typeof createQuoteSchema>;
export type CreateServiceFormValues = z.infer<typeof createServiceSchema>;
export type UploadMediaFormValues = z.infer<typeof uploadMediaSchema>;
