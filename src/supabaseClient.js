import { createClient } from '@supabase/supabase-js'

// Variáveis do arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Verifique se as chaves do Supabase estão corretas no arquivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
