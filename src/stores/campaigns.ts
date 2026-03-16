import { create } from "zustand";
import type {
  Campaign,
  CampaignChannels,
  CampaignMockSent,
  CampaignStatus,
} from "@/types";

const emptyMockSent: CampaignMockSent = {
  in_app: 0,
  email: 0,
  sms: 0,
};

function defaultChannels(): CampaignChannels {
  return { in_app: true, email: false, sms: false };
}

export function createEmptyCampaign(createdBy: string): Partial<Campaign> {
  const now = new Date().toISOString();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  return {
    title: "",
    type: "custom",
    target_id: null,
    target_label: "",
    status: "draft",
    offer_headline: "",
    offer_body: "",
    offer_cta: "Claim Offer",
    offer_code: null,
    discount_type: "none",
    discount_value: null,
    start_date: now.slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    max_redemptions: null,
    members_only: false,
    audience_type: "all_customers",
    audience_params: null,
    channels: defaultChannels(),
    ai_generated: false,
    mock_reach: 0,
    mock_sent: { ...emptyMockSent },
    mock_opens: 0,
    mock_clicks: 0,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
    published_at: null,
    scheduled_at: null,
  };
}

interface CampaignsState {
  campaigns: Campaign[];
  setCampaigns: (campaigns: Campaign[]) => void;
  getCampaignById: (id: string) => Campaign | undefined;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  duplicateCampaign: (id: string, createdBy: string) => Campaign | null;
  /** Generate plausible mock analytics from estimated reach (demo only). */
  setMockAnalyticsForPublish: (
    id: string,
    estimatedReach: number,
    channels: CampaignChannels
  ) => void;
}

export const useCampaignsStore = create<CampaignsState>((set, get) => ({
  campaigns: [],

  setCampaigns: (campaigns) => set({ campaigns }),

  getCampaignById: (id) => get().campaigns.find((c) => c.id === id),

  addCampaign: (campaign) =>
    set((state) => ({ campaigns: [campaign as Campaign, ...state.campaigns] })),

  updateCampaign: (id, data) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id
          ? { ...c, ...data, updated_at: new Date().toISOString() }
          : c
      ),
    })),

  duplicateCampaign: (id, createdBy) => {
    const campaign = get().getCampaignById(id);
    if (!campaign) return null;
    const now = new Date().toISOString();
    const newId = `camp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const copy: Campaign = {
      ...campaign,
      id: newId,
      title: `${campaign.title} (Copy)`,
      status: "draft",
      created_by: createdBy,
      created_at: now,
      updated_at: now,
      published_at: null,
      scheduled_at: null,
      mock_reach: 0,
      mock_sent: { ...emptyMockSent },
      mock_opens: 0,
      mock_clicks: 0,
    };
    set((state) => ({ campaigns: [copy, ...state.campaigns] }));
    return copy;
  },

  setMockAnalyticsForPublish: (id, estimatedReach, channels) => {
    const campaign = get().getCampaignById(id);
    if (!campaign) return;
    const sentInApp = channels.in_app
      ? Math.floor(estimatedReach * (0.3 + Math.random() * 0.4))
      : 0;
    const sentEmail = channels.email
      ? Math.floor(estimatedReach * (0.5 + Math.random() * 0.3))
      : 0;
    const sentSms = channels.sms
      ? Math.floor(estimatedReach * (0.2 + Math.random() * 0.2))
      : 0;
    const totalSent = sentInApp + sentEmail + sentSms;
    const opens = Math.floor(totalSent * (0.2 + Math.random() * 0.25));
    const clicks = Math.floor(opens * (0.3 + Math.random() * 0.4));
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id
          ? {
              ...c,
              mock_reach: estimatedReach,
              mock_sent: {
                in_app: sentInApp,
                email: sentEmail,
                sms: sentSms,
              },
              mock_opens: opens,
              mock_clicks: clicks,
              updated_at: new Date().toISOString(),
            }
          : c
      ),
    }));
  },
}));
