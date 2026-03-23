"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Package, Wrench, FolderTree, Sparkles, Smartphone, Mail, MessageSquare } from "lucide-react";
import type {
  CampaignType,
  CampaignAudienceType,
  CampaignChannels,
  CampaignDiscountType,
} from "@/types";
import type { Service } from "@/types";
import { cn } from "@/lib/utils";

const CAMPAIGN_TYPES: { value: CampaignType; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "product", label: "Product Promotion", desc: "Promote a specific product", icon: Package },
  { value: "service", label: "Service Promotion", desc: "Promote a specific service", icon: Wrench },
  { value: "category", label: "Category Promotion", desc: "Promote a service or product category", icon: FolderTree },
  { value: "custom", label: "Custom Campaign", desc: "Create a fully custom offer", icon: Sparkles },
];

const GOAL_OPTIONS = [
  { value: "drive sales", label: "Drive sales" },
  { value: "promote new service", label: "Promote new service" },
  { value: "seasonal offer", label: "Seasonal offer" },
  { value: "member reward", label: "Member reward" },
  { value: "upsell previous customers", label: "Upsell previous customers" },
  { value: "clear inventory", label: "Clear inventory" },
];

const URGENCY_OPTIONS = [
  { value: "limited time", label: "Limited time" },
  { value: "limited spots", label: "Limited spots" },
  { value: "end of season", label: "End of season" },
  { value: "no urgency", label: "No urgency" },
];

const TONE_OPTIONS = [
  { value: "premium clients", label: "Premium clients" },
  { value: "general customers", label: "General customers" },
  { value: "members", label: "Members" },
  { value: "new leads", label: "New leads" },
];

const AUDIENCE_OPTIONS: { value: CampaignAudienceType; label: string; reach: number }[] = [
  { value: "all_users", label: "All App Users", reach: 847 },
  { value: "all_customers", label: "All Customers", reach: 612 },
  { value: "previous_customers", label: "Previous Customers", reach: 428 },
  { value: "members_only", label: "Members Only", reach: 124 },
  { value: "service_history", label: "Customers by Service", reach: 380 },
  { value: "manual", label: "Custom / Manual", reach: 0 },
];

const CATEGORY_LABELS: Record<string, string> = {
  full_wrap: "Full Wrap",
  ppf: "PPF",
  ceramic_coating: "Ceramic Coating",
  tint: "Tint",
  chrome_delete: "Chrome Delete",
  detailing: "Detailing",
  custom: "Custom",
};

export interface WizardFormState {
  type: CampaignType;
  target_id: string | null;
  target_label: string;
  goal: string;
  discountDirection: string;
  urgency: string;
  audienceTone: string;
  additionalContext: string;
  title: string;
  offer_headline: string;
  offer_body: string;
  offer_cta: string;
  offer_code: string | null;
  email_subject: string;
  sms_version: string;
  discount_type: CampaignDiscountType;
  discount_value: number | null;
  start_date: string;
  end_date: string;
  max_redemptions: number | null;
  members_only: boolean;
  audience_type: CampaignAudienceType;
  channels: CampaignChannels;
}

export const defaultWizardState: WizardFormState = {
  type: "custom",
  target_id: null,
  target_label: "",
  goal: "drive sales",
  discountDirection: "",
  urgency: "limited time",
  audienceTone: "premium clients",
  additionalContext: "",
  title: "",
  offer_headline: "",
  offer_body: "",
  offer_cta: "Claim Offer",
  offer_code: null,
  email_subject: "",
  sms_version: "",
  discount_type: "none",
  discount_value: null,
  start_date: "",
  end_date: "",
  max_redemptions: null,
  members_only: false,
  audience_type: "all_customers",
  channels: { in_app: true, email: false, sms: false },
};

export function Step1Type({
  value,
  onChange,
  onNext,
}: {
  value: CampaignType;
  onChange: (v: CampaignType) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">What kind of campaign is this?</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {CAMPAIGN_TYPES.map(({ value: v, label, desc, icon: Icon }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150",
              value === v
                ? "border-wraptors-gold bg-wraptors-gold/5 shadow-gold-glow"
                : "border-wraptors-border bg-wraptors-surface hover:border-wraptors-gold/50 hover:bg-wraptors-surface-hover"
            )}
          >
            <span className={cn("h-8 w-0.5 shrink-0 rounded-full", value === v ? "bg-wraptors-gold" : "bg-transparent")} />
            <div className="flex flex-1 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wraptors-gold/20 text-wraptors-gold">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-white">{label}</p>
                <p className="text-sm text-wraptors-muted">{desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <Button onClick={onNext}>Continue</Button>
    </div>
  );
}

export function Step2Target({
  type,
  targetId,
  targetLabel,
  onChangeTarget,
  services,
  onNext,
  onBack,
}: {
  type: CampaignType;
  targetId: string | null;
  targetLabel: string;
  onChangeTarget: (id: string | null, label: string) => void;
  services: Service[];
  onNext: () => void;
  onBack: () => void;
}) {
  if (type === "custom") return null;

  const categories = Object.entries(CATEGORY_LABELS).map(([id, label]) => ({ id, label }));
  const options = type === "category" ? categories : services.map((s) => ({ id: s.id, label: s.name }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Select target</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChangeTarget(id, label)}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              targetId === id
                ? "border-wraptors-gold bg-wraptors-gold/5"
                : "border-wraptors-border bg-wraptors-surface hover:border-wraptors-gold/50"
            )}
          >
            <p className="font-medium text-white">{label}</p>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!targetId}>Continue</Button>
      </div>
    </div>
  );
}

export function Step3AIOffer({
  state,
  update,
  onGenerate,
  generating,
  onNext,
  onBack,
}: {
  state: WizardFormState;
  update: (patch: Partial<WizardFormState>) => void;
  onGenerate: () => Promise<void>;
  generating: boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Generate your campaign offer</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Campaign goal</Label>
          <Select value={state.goal} onValueChange={(v) => update({ goal: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {GOAL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Discount direction (optional)</Label>
          <Input
            placeholder="e.g. 20% off or free tint with PPF"
            value={state.discountDirection}
            onChange={(e) => update({ discountDirection: e.target.value })}
          />
        </div>
        <div>
          <Label>Urgency</Label>
          <Select value={state.urgency} onValueChange={(v) => update({ urgency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {URGENCY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Target audience tone</Label>
          <Select value={state.audienceTone} onValueChange={(v) => update({ audienceTone: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Additional context (optional)</Label>
        <Textarea
          placeholder="Any extra notes for the AI..."
          value={state.additionalContext}
          onChange={(e) => update({ additionalContext: e.target.value })}
          rows={3}
        />
      </div>
      <Button
        className="w-full bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold-light"
        onClick={onGenerate}
        disabled={generating}
      >
        {generating ? (
          <span className="inline-block h-4 w-4 animate-pulse rounded bg-wraptors-black/30" />
        ) : (
          "Generate with AI"
        )}
      </Button>
      <div className="space-y-3 rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 p-4">
        <Label>Offer headline</Label>
        <Input
          value={state.offer_headline}
          onChange={(e) => update({ offer_headline: e.target.value })}
          placeholder="Headline"
        />
        <Label>Offer body</Label>
        <Textarea
          value={state.offer_body}
          onChange={(e) => update({ offer_body: e.target.value })}
          placeholder="Body copy"
          rows={2}
        />
        <Label>CTA</Label>
        <Input
          value={state.offer_cta}
          onChange={(e) => update({ offer_cta: e.target.value })}
          placeholder="Button text"
        />
        <Label>Promo code</Label>
        <Input
          value={state.offer_code ?? ""}
          onChange={(e) => update({ offer_code: e.target.value || null })}
          placeholder="e.g. WRAP20"
        />
        <Label>Email subject</Label>
        <Input
          value={state.email_subject}
          onChange={(e) => update({ email_subject: e.target.value })}
          placeholder="Email subject line"
        />
        <Label>SMS version (max 160 chars)</Label>
        <Input
          value={state.sms_version}
          onChange={(e) => update({ sms_version: e.target.value.slice(0, 160) })}
          placeholder="Short SMS text"
          maxLength={160}
        />
        <p className="text-xs text-wraptors-muted">{state.sms_version.length} / 160</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}

export function Step4OfferConfig({
  state,
  update,
  onNext,
  onBack,
}: {
  state: WizardFormState;
  update: (patch: Partial<WizardFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Offer configuration</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Campaign title</Label>
          <Input
            value={state.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="e.g. Spring PPF Special"
          />
        </div>
        <div>
          <Label>Promo code</Label>
          <Input
            value={state.offer_code ?? ""}
            onChange={(e) => update({ offer_code: e.target.value || null })}
            placeholder="WRAP20"
          />
        </div>
        <div>
          <Label>Discount type</Label>
          <Select
            value={state.discount_type}
            onValueChange={(v) => update({ discount_type: v as CampaignDiscountType, discount_value: v === "none" ? null : state.discount_value })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No discount</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(state.discount_type === "percentage" || state.discount_type === "fixed") && (
          <div>
            <Label>Discount value</Label>
            <Input
              type="number"
              min={0}
              max={state.discount_type === "percentage" ? 100 : undefined}
              value={state.discount_value ?? ""}
              onChange={(e) => update({ discount_value: e.target.value ? Number(e.target.value) : null })}
              placeholder={state.discount_type === "percentage" ? "20" : "50"}
            />
          </div>
        )}
        <div>
          <Label>Start date</Label>
          <DatePicker value={state.start_date || today} onChange={(v) => update({ start_date: v || today })} />
        </div>
        <div>
          <Label>End date</Label>
          <DatePicker value={state.end_date} onChange={(v) => update({ end_date: v || "" })} />
        </div>
        <div>
          <Label>Max redemptions (optional)</Label>
          <Input
            type="number"
            min={0}
            value={state.max_redemptions ?? ""}
            onChange={(e) => update({ max_redemptions: e.target.value ? Number(e.target.value) : null })}
            placeholder="Leave empty for unlimited"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="members_only"
            checked={state.members_only}
            onChange={(e) => update({ members_only: e.target.checked })}
            className="rounded border-wraptors-border bg-wraptors-charcoal text-wraptors-gold focus:ring-wraptors-gold"
          />
          <Label htmlFor="members_only">Members only</Label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}

export function Step5Audience({
  value,
  reach,
  onChange,
  onNext,
  onBack,
}: {
  value: CampaignAudienceType;
  reach: number;
  onChange: (v: CampaignAudienceType) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Who should receive this campaign?</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {AUDIENCE_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-xl border-2 p-4 text-left",
              value === o.value
                ? "border-wraptors-gold bg-wraptors-gold/5"
                : "border-wraptors-border bg-wraptors-surface hover:border-wraptors-gold/50"
            )}
          >
            <p className="font-medium text-white">{o.label}</p>
            {o.value === "manual" && (
              <p className="text-xs text-wraptors-muted mt-1">Coming soon</p>
            )}
          </button>
        ))}
      </div>
      <p className="text-sm text-wraptors-muted">Estimated reach: <span className="text-wraptors-gold font-medium">{reach.toLocaleString()}</span> people</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}

export function Step6Channels({
  channels,
  onChange,
  onNext,
  onBack,
}: {
  channels: CampaignChannels;
  onChange: (c: CampaignChannels) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const set = (key: keyof CampaignChannels, val: boolean) => onChange({ ...channels, [key]: val });
  const atLeastOne = channels.in_app || channels.email || channels.sms;
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">How should this campaign be delivered?</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => set("in_app", !channels.in_app)}
          className={cn(
            "rounded-xl border-2 p-4 text-left transition-all",
            channels.in_app ? "border-wraptors-gold bg-wraptors-gold/5" : "border-wraptors-border bg-wraptors-surface"
          )}
        >
          <Smartphone className="h-8 w-8 text-wraptors-gold mb-2" />
          <p className="font-medium text-white">In-App Notification</p>
          <p className="text-sm text-wraptors-muted">Sent as a push notification to app users</p>
        </button>
        <button
          type="button"
          onClick={() => set("email", !channels.email)}
          className={cn(
            "rounded-xl border-2 p-4 text-left transition-all",
            channels.email ? "border-wraptors-gold bg-wraptors-gold/5" : "border-wraptors-border bg-wraptors-surface"
          )}
        >
          <Mail className="h-8 w-8 text-wraptors-gold mb-2" />
          <p className="font-medium text-white">Email</p>
          <p className="text-sm text-wraptors-muted">Delivered to customer email addresses</p>
        </button>
        <button
          type="button"
          onClick={() => set("sms", !channels.sms)}
          className={cn(
            "rounded-xl border-2 p-4 text-left transition-all",
            channels.sms ? "border-wraptors-gold bg-wraptors-gold/5" : "border-wraptors-border bg-wraptors-surface"
          )}
        >
          <MessageSquare className="h-8 w-8 text-wraptors-gold mb-2" />
          <p className="font-medium text-white">SMS</p>
          <p className="text-sm text-wraptors-muted">Text message to customer phone numbers</p>
        </button>
      </div>
      {!atLeastOne && (
        <p className="text-sm text-amber-400">Select at least one channel to continue.</p>
      )}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!atLeastOne}>Continue</Button>
      </div>
    </div>
  );
}

export function Step7Preview({
  state,
  onBack,
  onNext,
}: {
  state: WizardFormState;
  onBack: () => void;
  onNext: () => void;
}) {
  const { channels, offer_headline, offer_body, offer_cta, offer_code, email_subject, sms_version, end_date, members_only, title } = state;
  const smsCopy = sms_version || offer_body;
  const smsLen = smsCopy.length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Preview your campaign</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {channels.in_app && (
          <Card className="overflow-hidden border-wraptors-border bg-wraptors-charcoal/50 backdrop-blur-xl">
            <CardContent className="p-0">
              <div className="border-b border-wraptors-border px-3 py-2 text-xs text-wraptors-muted">
                In-App Notification
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 rounded-lg bg-wraptors-surface p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-wraptors-gold/20 text-wraptors-gold font-bold">W</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{offer_headline || "Offer"}</p>
                    <p className="text-sm text-wraptors-muted truncate">{offer_body?.slice(0, 60) || "—"}</p>
                    <p className="text-xs text-wraptors-gold mt-0.5">now</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-wraptors-border px-3 py-2 text-xs text-wraptors-muted">
                App Offer Card
              </div>
              <div className="p-4">
                <div className="rounded-xl border border-wraptors-border bg-wraptors-surface p-4">
                  <p className="text-xs text-wraptors-muted uppercase tracking-wider">{title || "Campaign"}</p>
                  <h3 className="mt-1 text-lg font-bold text-white">{offer_headline}</h3>
                  <p className="mt-2 text-sm text-wraptors-muted">{offer_body}</p>
                  {offer_code && (
                    <p className="mt-2 font-mono text-sm tracking-widest text-wraptors-gold uppercase">[ {offer_code} ]</p>
                  )}
                  <Button className="mt-3 w-full" size="sm">{offer_cta}</Button>
                  {end_date && <p className="mt-2 text-xs text-wraptors-muted">Expires {end_date}</p>}
                  {members_only && <span className="mt-2 inline-block text-xs text-wraptors-gold">Members only</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {channels.email && (
          <Card className="overflow-hidden border-wraptors-border bg-wraptors-charcoal/50 backdrop-blur-xl">
            <CardContent className="p-0">
              <div className="border-b border-wraptors-border px-3 py-2 text-xs text-wraptors-muted">
                Email Preview
              </div>
              <div className="rounded-b-lg bg-white/95 p-4 text-black">
                <p className="text-sm font-medium text-gray-600">Subject: {email_subject || offer_headline}</p>
                <div className="mt-4 h-8 w-24 rounded bg-wraptors-charcoal" />
                <h3 className="mt-4 text-lg font-bold">{offer_headline}</h3>
                <p className="mt-2 text-sm text-gray-700">{offer_body}</p>
                <button type="button" className="mt-3 rounded bg-wraptors-gold px-4 py-2 text-sm font-medium text-wraptors-black">
                  {offer_cta}
                </button>
                {offer_code && <p className="mt-2 font-mono text-sm text-wraptors-gold">{offer_code}</p>}
                <p className="mt-4 text-xs text-gray-500">Unsubscribe</p>
              </div>
            </CardContent>
          </Card>
        )}

        {channels.sms && (
          <Card className="overflow-hidden border-wraptors-border bg-wraptors-charcoal/50 backdrop-blur-xl">
            <CardContent className="p-0">
              <div className="border-b border-wraptors-border px-3 py-2 text-xs text-wraptors-muted">
                SMS Preview
              </div>
              <div className="p-4">
                <p className="text-xs text-wraptors-muted mb-1">Wraptors</p>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-wraptors-surface px-4 py-3">
                  <p className="text-sm text-white">{smsCopy || "—"}</p>
                </div>
                <p className={cn("mt-2 text-xs", smsLen > 160 ? "text-red-400" : "text-wraptors-gold")}>
                  {smsLen} / 160 characters
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Continue to launch</Button>
      </div>
    </div>
  );
}

export function Step8Publish({
  state,
  estimatedReach,
  canPublish,
  onSaveDraft,
  onSchedule,
  onPublishNow,
  onBack,
  scheduling,
  setScheduling,
  scheduledAt,
  setScheduledAt,
}: {
  state: WizardFormState;
  estimatedReach: number;
  canPublish: boolean;
  onSaveDraft: () => void;
  onSchedule: (at: string) => void;
  onPublishNow: () => void;
  onBack: () => void;
  scheduling: boolean;
  setScheduling: (v: boolean) => void;
  scheduledAt: string;
  setScheduledAt: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Launch your campaign</h2>
      <Card className="border-wraptors-border">
        <CardContent className="p-5">
          <p className="font-medium text-white">{state.title || "Untitled campaign"}</p>
          <p className="text-sm text-wraptors-muted">{state.type} · {state.target_label || "—"}</p>
          <p className="text-sm text-wraptors-muted mt-1">{state.start_date} → {state.end_date}</p>
          <p className="text-sm text-wraptors-muted">Audience: {state.audience_type} · Est. reach: {estimatedReach.toLocaleString()}</p>
          <p className="text-sm text-wraptors-muted">Channels: {[state.channels.in_app && "In-app", state.channels.email && "Email", state.channels.sms && "SMS"].filter(Boolean).join(", ")}</p>
          {state.offer_code && <p className="text-sm text-wraptors-gold font-mono mt-1">Code: {state.offer_code}</p>}
        </CardContent>
      </Card>

      {scheduling ? (
        <div className="space-y-3">
          <Label>Schedule date & time</Label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setScheduling(false)}>Cancel</Button>
            <Button onClick={() => onSchedule(scheduledAt)}>Confirm schedule</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onSaveDraft}>Save as Draft</Button>
          {canPublish && (
            <>
              <Button variant="secondary" onClick={() => setScheduling(true)}>Schedule</Button>
              <Button onClick={onPublishNow}>Publish Now</Button>
            </>
          )}
          <Button variant="outline" onClick={onBack}>Back</Button>
        </div>
      )}
    </div>
  );
}
