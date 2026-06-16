'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, DollarSign, Calendar, BarChart2, LogOut, Users, UserCheck, Scissors } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const nav = [
  { href: '/', label: 'Painel', icon: LayoutDashboard },
  { href: '/agendamentos', label: 'Agendamentos', icon: Calendar },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/profissionais', label: 'Profissionais', icon: UserCheck },
  { href: '/servicos', label: 'Serviços', icon: Scissors },
  { href: '/estoque', label: 'Estoque', icon: Package },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-800">Clínica Gestão</p>
        <p className="text-xs text-gray-400 mt-0.5">Sistema de gestão</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 w-full"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
