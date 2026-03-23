import { createClient } from '@/lib/supabase/server'

type PipelineStageRow = Record<string, unknown>
type PipelineItemRow = Record<string, unknown>

export async function getPipelineStages(): Promise<PipelineStageRow[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .order('position', { ascending: true })
    if (error) return []
    return (data ?? []) as PipelineStageRow[]
  } catch {
    return []
  }
}

export async function getPipelineItems(): Promise<PipelineItemRow[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('pipeline_items')
      .select('*')
      .order('position', { ascending: true })
    if (error) return []
    return (data ?? []) as PipelineItemRow[]
  } catch {
    return []
  }
}
