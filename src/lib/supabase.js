import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const imageUrl = (path) =>
  path?.startsWith('http') ? path : supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
