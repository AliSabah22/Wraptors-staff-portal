import { createClient } from '@/lib/supabase/server'

type ChatThreadRow = Record<string, unknown>
type ChatMessageRow = Record<string, unknown>

export async function getChatThreads(): Promise<ChatThreadRow[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('chat_threads')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []) as ChatThreadRow[]
  } catch {
    return []
  }
}

export async function getChatMessages(threadId: string): Promise<ChatMessageRow[]> {
  try {
    const supabase = (await createClient()) as any
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
    if (error) return []
    return (data ?? []) as ChatMessageRow[]
  } catch {
    return []
  }
}
