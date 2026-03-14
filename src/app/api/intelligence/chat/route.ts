import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { normalizeRole } from "@/lib/auth/roles";
import { mockStaff } from "@/data/mock";
import {
  getRevenueContext,
  getJobsContext,
  getPipelineContext,
  getQuoteContext,
  getTechnicianContext,
  getCustomerContext,
  getCalendarContext,
} from "@/lib/intelligence/analyticsContext";
import { getContextModulesForMessage, type ContextModule } from "@/lib/intelligence/contextRouting";
import { checkRateLimit, appendQueryLog } from "@/lib/intelligence/rateLimitAndLog";

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;

function sanitizeMessage(message: unknown): string {
  if (typeof message !== "string") return "";
  let s = message.trim();
  s = s.replace(/<[^>]*>/g, "");
  return s.slice(0, 1000);
}

function buildSystemPrompt(contextJson: string, todayDate: string): string {
  return `You are the Wraptors Intelligence Assistant — an AI business advisor embedded inside the Wraptors Staff Portal, an operational management system for a high-end automotive wrap, PPF, tint, and detailing shop.

You have access to real-time data from the shop's operations. Your job is to help the CEO understand their business performance, identify problems, and make smarter decisions.

CURRENT BUSINESS DATA:
${contextJson}

TODAY'S DATE: ${todayDate}

YOUR BEHAVIOR RULES:
1. Be direct and specific. Use the actual numbers from the data provided. Never give generic business advice that isn't grounded in the shop's real metrics.
2. When you spot a problem in the data, name it clearly. Don't soften findings.
3. When you make a recommendation, connect it explicitly to the data that prompted it.
4. Format responses for readability — use short paragraphs, bullet points for lists, and bold for key numbers. Keep responses concise unless a detailed breakdown is requested.
5. If asked about something not in your data (e.g. competitor pricing, industry benchmarks), say so clearly rather than guessing.
6. Never make up numbers. If the data shows zero or null for something, report that honestly.
7. You cannot take any actions in the system. You can only observe and advise. If the CEO asks you to do something (e.g. "send a quote"), explain that you can provide the recommendation but they need to take the action in the portal.
8. Keep a professional but direct tone — this is a CEO getting a briefing from a smart analyst, not a customer service interaction.
9. When relevant, end responses with 1-2 specific suggested next actions the CEO can take inside the portal right now.
10. Remember conversation history — if the CEO asks a follow-up question, use prior context.

SHOP CONTEXT:
- Services offered: automotive wrap, PPF, paint protection film, window tint, ceramic coating, detailing
- High-end positioning — clients include exotic and luxury vehicle owners
- Three roles in the system: CEO, Receptionist, Technician`;
}

function gatherContext(modules: ContextModule[]): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};
  try {
    if (modules.includes("revenue")) ctx.revenue = getRevenueContext();
  } catch { ctx.revenue = null; }
  try {
    if (modules.includes("jobs")) ctx.jobs = getJobsContext();
  } catch { ctx.jobs = null; }
  try {
    if (modules.includes("pipeline")) ctx.pipeline = getPipelineContext();
  } catch { ctx.pipeline = null; }
  try {
    if (modules.includes("quotes")) ctx.quotes = getQuoteContext();
  } catch { ctx.quotes = null; }
  try {
    if (modules.includes("technician")) ctx.technician = getTechnicianContext();
  } catch { ctx.technician = null; }
  try {
    if (modules.includes("customer")) ctx.customer = getCustomerContext();
  } catch { ctx.customer = null; }
  try {
    if (modules.includes("calendar")) ctx.calendar = getCalendarContext();
  } catch { ctx.calendar = null; }
  return ctx;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const userId = request.headers.get("x-user-id") ?? request.headers.get("X-User-Id") ?? "";
  const user = mockStaff.find((u) => u.id === userId);
  const role = user ? normalizeRole(user.role) : "technician";
  if (role !== "ceo") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rate = checkRateLimit(userId);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `You've reached the AI query limit. Try again in ${rate.retryAfterMinutes} minutes.` },
      { status: 429 }
    );
  }

  let body: { message?: unknown; conversation_history?: unknown[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawMessage = body.message;
  const message = sanitizeMessage(rawMessage);
  if (!message) {
    return NextResponse.json({ error: "Message is required and must be non-empty" }, { status: 400 });
  }

  const conversation_history = Array.isArray(body.conversation_history) ? body.conversation_history : [];
  const modules = getContextModulesForMessage(message);
  const contextData = gatherContext(modules);
  const contextJson = JSON.stringify(contextData, null, 2);
  const todayDate = new Date().toISOString().slice(0, 10);
  const systemPrompt = buildSystemPrompt(contextJson, todayDate);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Intelligence service is not configured. Please contact support." },
      { status: 503 }
    );
  }

  const anthropic = new Anthropic({ apiKey });

  type HistoryItem = { role: string; content: string };
  const messages: Anthropic.MessageParam[] = (conversation_history as unknown[])
    .slice(-10)
    .filter((m): m is HistoryItem => !!m && typeof m === "object" && "role" in m && "content" in m)
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: String(m.content).slice(0, 8000),
    }));
  messages.push({ role: "user", content: message });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages,
        });

        messageStream.on("text", (text: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        });

        await messageStream.finalMessage();
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        const responseTimeMs = Date.now() - startTime;
        appendQueryLog({
          user_id: userId,
          message_preview: message.slice(0, 100),
          context_modules_used: modules,
          response_time_ms: responseTimeMs,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        if (!errorMessage.includes("API key") && !errorMessage.includes("api_key")) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Something went wrong fetching your data. Please try again." })}\n\n`)
          );
        } else {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Intelligence service is not configured." })}\n\n`)
          );
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
