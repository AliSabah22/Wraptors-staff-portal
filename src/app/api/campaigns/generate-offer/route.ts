import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { errorResponse, serverErrorResponse, successResponse } from "@/lib/api/helpers";

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;

export interface GenerateOfferBody {
  goal?: string;
  discountDirection?: string;
  urgency?: string;
  audienceTone?: string;
  additionalContext?: string;
  targetLabel?: string;
  campaignType?: string;
}

export interface GeneratedOffer {
  title: string;
  offer_headline: string;
  offer_body: string;
  offer_cta: string;
  promo_code: string | null;
  sms_version: string;
  email_subject: string;
  urgency_line: string;
}

function parseStructuredResponse(text: string): GeneratedOffer | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return {
      title: typeof parsed.title === "string" ? parsed.title : "Special Offer",
      offer_headline:
        typeof parsed.offer_headline === "string"
          ? parsed.offer_headline
          : "Limited time offer",
      offer_body:
        typeof parsed.offer_body === "string"
          ? parsed.offer_body
          : "Get a great deal today.",
      offer_cta:
        typeof parsed.offer_cta === "string" ? parsed.offer_cta : "Claim Offer",
      promo_code:
        typeof parsed.promo_code === "string" ? parsed.promo_code : null,
      sms_version:
        typeof parsed.sms_version === "string"
          ? parsed.sms_version.slice(0, 160)
          : "Limited time offer at Wraptors. Claim yours today!",
      email_subject:
        typeof parsed.email_subject === "string"
          ? parsed.email_subject
          : "Your exclusive offer from Wraptors",
      urgency_line:
        typeof parsed.urgency_line === "string" ? parsed.urgency_line : "",
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let body: GenerateOfferBody;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const goal = body.goal ?? "drive sales";
  const discountDirection = body.discountDirection ?? "";
  const urgency = body.urgency ?? "limited time";
  const audienceTone = body.audienceTone ?? "premium clients";
  const additionalContext = body.additionalContext ?? "";
  const targetLabel = body.targetLabel ?? "";
  const campaignType = body.campaignType ?? "custom";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "AI service is not configured.",
        fallback: {
          title: "Exclusive Offer",
          offer_headline: "Premium service at a special price",
          offer_body:
            "We're offering our best customers a limited-time deal. Book now and save.",
          offer_cta: "Claim Offer",
          promo_code: "WRAP20",
          sms_version:
            "Wraptors: Exclusive offer for you. Limited time. Reply to claim.",
          email_subject: "Your exclusive offer from Wraptors",
          urgency_line: "Offer expires soon.",
        },
      },
      { status: 503 }
    );
  }

  const systemPrompt = `You are a copywriter for Wraptors, a premium automotive wrap, PPF, tint, and detailing shop. Generate a single promotional campaign offer in JSON only. No markdown, no code fence — output only a valid JSON object with these exact keys: title, offer_headline, offer_body, offer_cta, promo_code (or null), sms_version (max 160 characters), email_subject, urgency_line. Keep tone premium and concise.`;

  const userPrompt = `Create a campaign offer with:
Goal: ${goal}
Discount or direction: ${discountDirection || "none specified"}
Urgency: ${urgency}
Target audience tone: ${audienceTone}
${targetLabel ? `Target product/service: ${targetLabel} (type: ${campaignType})` : ""}
${additionalContext ? `Additional context: ${additionalContext}` : ""}

Respond with ONLY a JSON object (no other text) with keys: title, offer_headline, offer_body, offer_cta, promo_code, sms_version (max 160 chars), email_subject, urgency_line.`;

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";
    const parsed = parseStructuredResponse(text);

    if (parsed) {
      return successResponse(parsed);
    }

    return NextResponse.json(
      {
        error: "Could not parse AI response.",
        fallback: {
          title: "Special Offer",
          offer_headline: "Limited time offer",
          offer_body: "Get a great deal at Wraptors.",
          offer_cta: "Claim Offer",
          promo_code: "WRAP20",
          sms_version: "Wraptors: Limited time offer. Reply to claim.",
          email_subject: "Your offer from Wraptors",
          urgency_line: "Offer expires soon.",
        },
      },
      { status: 422 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return serverErrorResponse(message || "AI request failed.");
  }
}
