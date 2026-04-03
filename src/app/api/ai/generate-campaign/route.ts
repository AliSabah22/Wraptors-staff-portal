import { z } from 'zod'
import { requirePermission } from '@/lib/auth/helpers'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/helpers'
import { parseBody } from '@/lib/api/validate'

const GenerateCampaignSchema = z.object({
  goal: z.string(),
  target_label: z.string(),
  discount_hint: z.string().optional(),
  urgency: z.string().optional(),
  audience_tone: z.string().optional(),
  additional_context: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    await requirePermission('campaigns.create')
    const parsed = await parseBody(request, GenerateCampaignSchema)
    if ('error' in parsed) return parsed.error

    const { goal, target_label, discount_hint, urgency, audience_tone, additional_context } = parsed.data
    const prompt = `You are a marketing copywriter for Wraptors - a premium automotive wrap, PPF, tint, and detailing shop. Write a promotional campaign offer.

Target service/product: ${target_label}
Campaign goal: ${goal}
${discount_hint ? `Discount/offer: ${discount_hint}` : ''}
${urgency ? `Urgency angle: ${urgency}` : ''}
${audience_tone ? `Audience tone: ${audience_tone}` : ''}
${additional_context ? `Additional context: ${additional_context}` : ''}

Respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "title": "short campaign title",
  "offer_headline": "punchy headline under 10 words",
  "offer_body": "2-3 sentence description of the offer",
  "offer_cta": "call to action button text",
  "offer_code": "promo code like WRAP20 or PPF15",
  "sms_version": "SMS version under 160 characters",
  "email_subject": "email subject line",
  "urgency_line": "short urgency statement"
}`

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicResponse.ok) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      })

      if (!openaiResponse.ok) return errorResponse('AI generation failed')
      const openaiData = (await openaiResponse.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const content = openaiData.choices?.[0]?.message?.content
      if (!content) return errorResponse('AI generation failed')
      return successResponse(JSON.parse(content))
    }

    const anthropicData = (await anthropicResponse.json()) as {
      content?: Array<{ text?: string }>
    }
    const content = anthropicData.content?.[0]?.text
    if (!content) return errorResponse('AI generation failed')
    return successResponse(JSON.parse(content))
  } catch (error) {
    return serverErrorResponse(error)
  }
}
