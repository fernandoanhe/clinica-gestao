import { createClient } from '@/lib/supabase/server'

export type Role = 'admin' | 'vendedor'

export async function getPerfilUsuario(): Promise<Role> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'vendedor'

  const { data } = await supabase
    .from('perfis')
    .select('role')
    .eq('id', user.id)
    .single()

  return (data?.role as Role) ?? 'vendedor'
}
