"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCampaignsStore,
  useAuthStore,
  useNotificationsStore,
  useServicesStore,
} from "@/stores";
import { usePermissions } from "@/hooks/usePermissions";
import { resolveAudienceSegment } from "@/lib/campaigns/distribution";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  defaultWizardState,
  Step1Type,
  Step2Target,
  Step3AIOffer,
  Step4OfferConfig,
  Step5Audience,
  Step6Channels,
  Step7Preview,
  Step8Publish,
} from "@/components/campaigns/campaign-wizard-steps";
import type { WizardFormState } from "@/components/campaigns/campaign-wizard-steps";
import type { Campaign } from "@/types";
import { ChevronLeft } from "lucide-react";

const TOTAL_STEPS = 8;
const SHOP_ID = "shop_wraptors_1";

function campaignToWizardState(c: Campaign): WizardFormState {
  return {
    type: c.type,
    target_id: c.target_id,
    target_label: c.target_label,
    goal: "drive sales",
    discountDirection: "",
    urgency: "limited time",
    audienceTone: "premium clients",
    additionalContext: "",
    title: c.title,
    offer_headline: c.offer_headline,
    offer_body: c.offer_body,
    offer_cta: c.offer_cta,
    offer_code: c.offer_code,
    email_subject: c.email_subject ?? "",
    sms_version: c.sms_version ?? c.offer_body?.slice(0, 160) ?? "",
    discount_type: c.discount_type,
    discount_value: c.discount_value,
    start_date: c.start_date,
    end_date: c.end_date,
    max_redemptions: c.max_redemptions,
    members_only: c.members_only,
    audience_type: c.audience_type,
    channels: c.channels,
  };
}

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const getCampaignById = useCampaignsStore((s) => s.getCampaignById);
  const updateCampaign = useCampaignsStore((s) => s.updateCampaign);
  const setMockAnalyticsForPublish = useCampaignsStore((s) => s.setMockAnalyticsForPublish);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const user = useAuthStore((s) => s.user);
  const services = useServicesStore((s) => s.services);
  const { hasPermission } = usePermissions();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardFormState | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const campaign = getCampaignById(id);

  useEffect(() => {
    if (campaign && !form) {
      setForm(campaignToWizardState(campaign));
    }
  }, [campaign, form]);

  const updateForm = useCallback((patch: Partial<WizardFormState>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  const estimatedReach = form ? resolveAudienceSegment(form.audience_type, null) : 0;

  const handleGenerateOffer = useCallback(async () => {
    if (!form) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/campaigns/generate-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: form.goal,
          discountDirection: form.discountDirection,
          urgency: form.urgency,
          audienceTone: form.audienceTone,
          additionalContext: form.additionalContext,
          targetLabel: form.target_label,
          campaignType: form.type,
        }),
      });
      const data = await res.json();
      if (data.fallback && !data.title) {
        updateForm({
          title: data.fallback.title,
          offer_headline: data.fallback.offer_headline,
          offer_body: data.fallback.offer_body,
          offer_cta: data.fallback.offer_cta,
          offer_code: data.fallback.promo_code,
          email_subject: data.fallback.email_subject,
          sms_version: data.fallback.sms_version?.slice(0, 160) ?? "",
        });
      } else if (data.title || data.offer_headline) {
        updateForm({
          title: data.title ?? form.title,
          offer_headline: data.offer_headline ?? form.offer_headline,
          offer_body: data.offer_body ?? form.offer_body,
          offer_cta: data.offer_cta ?? form.offer_cta,
          offer_code: data.promo_code ?? form.offer_code,
          email_subject: data.email_subject ?? form.email_subject,
          sms_version: (data.sms_version ?? form.sms_version)?.slice(0, 160) ?? "",
        });
      }
    } catch {
      // keep form as is
    } finally {
      setGenerating(false);
    }
  }, [form, updateForm]);

  const handleSaveDraft = useCallback(() => {
    if (!form || !campaign) return;
    updateCampaign(id, {
      title: form.title || "Untitled campaign",
      type: form.type,
      target_id: form.target_id,
      target_label: form.target_label,
      offer_headline: form.offer_headline,
      offer_body: form.offer_body,
      offer_cta: form.offer_cta,
      offer_code: form.offer_code,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      start_date: form.start_date,
      end_date: form.end_date,
      max_redemptions: form.max_redemptions,
      members_only: form.members_only,
      audience_type: form.audience_type,
      channels: form.channels,
      sms_version: form.sms_version || undefined,
      email_subject: form.email_subject || undefined,
      status: "draft",
    });
    router.push(`/campaigns/${id}`);
  }, [form, campaign, id, updateCampaign, router]);

  const handleSchedule = useCallback(
    (at: string) => {
      if (!form || !campaign) return;
      updateCampaign(id, {
        title: form.title || "Untitled campaign",
        type: form.type,
        target_id: form.target_id,
        target_label: form.target_label,
        offer_headline: form.offer_headline,
        offer_body: form.offer_body,
        offer_cta: form.offer_cta,
        offer_code: form.offer_code,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        start_date: form.start_date,
        end_date: form.end_date,
        max_redemptions: form.max_redemptions,
        members_only: form.members_only,
        audience_type: form.audience_type,
        channels: form.channels,
        sms_version: form.sms_version || undefined,
        email_subject: form.email_subject || undefined,
        status: "scheduled",
        scheduled_at: at,
      });
      addNotification({
        shopId: SHOP_ID,
        userId: user?.id ?? "",
        type: "campaign_scheduled",
        title: "Campaign scheduled",
        message: `Campaign "${form.title || "Untitled"}" has been scheduled for ${new Date(at).toLocaleString()}.`,
        read: false,
        link: `/campaigns/${id}`,
        createdAt: new Date().toISOString(),
      });
      setScheduling(false);
      router.push(`/campaigns/${id}`);
    },
    [form, campaign, id, user?.id, addNotification, updateCampaign, router]
  );

  const handlePublishNow = useCallback(() => {
    if (!form || !campaign) return;
    const now = new Date().toISOString();
    updateCampaign(id, {
      title: form.title || "Untitled campaign",
      type: form.type,
      target_id: form.target_id,
      target_label: form.target_label,
      offer_headline: form.offer_headline,
      offer_body: form.offer_body,
      offer_cta: form.offer_cta,
      offer_code: form.offer_code,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      start_date: form.start_date,
      end_date: form.end_date,
      max_redemptions: form.max_redemptions,
      members_only: form.members_only,
      audience_type: form.audience_type,
      channels: form.channels,
      sms_version: form.sms_version || undefined,
      email_subject: form.email_subject || undefined,
      status: "active",
      published_at: now,
      scheduled_at: null,
    });
    setMockAnalyticsForPublish(id, estimatedReach, form.channels);
    addNotification({
      shopId: SHOP_ID,
      userId: user?.id ?? "",
      type: "campaign_live",
      title: "Campaign live",
      message: `Campaign "${form.title || "Untitled"}" is now live. Estimated reach: ${estimatedReach.toLocaleString()} users.`,
      read: false,
      link: `/campaigns/${id}`,
      createdAt: new Date().toISOString(),
    });
    setPublishSuccess(true);
    setTimeout(() => router.push(`/campaigns/${id}`), 2000);
  }, [form, campaign, id, estimatedReach, user?.id, addNotification, updateCampaign, setMockAnalyticsForPublish, router]);

  const canPublish = hasPermission("campaigns.publish");

  useEffect(() => {
    if (scheduling && !scheduledAt) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);
      setScheduledAt(d.toISOString().slice(0, 16));
    }
  }, [scheduling, scheduledAt]);

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-wraptors-muted">Campaign not found.</p>
        <Button variant="link" asChild>
          <Link href="/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wraptors-gold border-t-transparent" />
      </div>
    );
  }

  if (publishSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[50vh] flex-col items-center justify-center"
      >
        <div className="rounded-2xl border border-wraptors-gold/30 bg-wraptors-gold/10 px-12 py-8 text-center">
          <h2 className="text-2xl font-bold text-wraptors-gold">Campaign Live!</h2>
          <p className="mt-2 text-wraptors-muted">Redirecting…</p>
        </div>
      </motion.div>
    );
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-4xl space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/campaigns/${id}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Edit Campaign</h1>
          <p className="text-wraptors-muted text-sm">Step {step} of {TOTAL_STEPS}</p>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="overflow-hidden border-wraptors-border bg-wraptors-surface/95 backdrop-blur-xl">
        <CardContent className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <Step1Type value={form.type} onChange={(v) => updateForm({ type: v })} onNext={() => setStep(form.type === "custom" ? 3 : 2)} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <Step2Target
                  type={form.type}
                  targetId={form.target_id}
                  targetLabel={form.target_label}
                  onChangeTarget={(id, label) => updateForm({ target_id: id, target_label: label })}
                  services={services}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <Step3AIOffer state={form} update={updateForm} onGenerate={handleGenerateOffer} generating={generating} onNext={() => setStep(4)} onBack={() => setStep(form.type === "custom" ? 1 : 2)} />
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="step4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <Step4OfferConfig state={form} update={updateForm} onNext={() => setStep(5)} onBack={() => setStep(3)} />
              </motion.div>
            )}
            {step === 5 && (
              <motion.div key="step5" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <Step5Audience value={form.audience_type} reach={estimatedReach} onChange={(v) => updateForm({ audience_type: v })} onNext={() => setStep(6)} onBack={() => setStep(4)} />
              </motion.div>
            )}
            {step === 6 && (
              <motion.div key="step6" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <Step6Channels channels={form.channels} onChange={(c) => updateForm({ channels: c })} onNext={() => setStep(7)} onBack={() => setStep(5)} />
              </motion.div>
            )}
            {step === 7 && (
              <motion.div key="step7" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <Step7Preview state={form} onBack={() => setStep(6)} onNext={() => setStep(8)} />
              </motion.div>
            )}
            {step === 8 && (
              <motion.div key="step8" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <Step8Publish
                  state={form}
                  estimatedReach={estimatedReach}
                  canPublish={canPublish}
                  onSaveDraft={handleSaveDraft}
                  onSchedule={handleSchedule}
                  onPublishNow={handlePublishNow}
                  onBack={() => setStep(7)}
                  scheduling={scheduling}
                  setScheduling={setScheduling}
                  scheduledAt={scheduledAt}
                  setScheduledAt={setScheduledAt}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
