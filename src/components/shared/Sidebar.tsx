'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, DollarSign, Calendar, BarChart2, LogOut, Users, History, AreaChart, ShoppingCart, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Role } from '@/lib/perfil'

const nav = [
  { href: '/', label: 'Painel', icon: LayoutDashboard, admin: true },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays, admin: false },
  { href: '/agendamentos', label: 'Agendamentos', icon: Calendar, admin: true },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart, admin: false },
  { href: '/clientes', label: 'Clientes', icon: Users, admin: false },
  { href: '/estoque', label: 'Estoque', icon: Package, admin: true },
  { href: '/estoque/movimentacoes', label: 'Movimentações', icon: History, sub: true, admin: true },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign, admin: true },
  { href: '/financeiro/grafico', label: 'Gráficos', icon: AreaChart, sub: true, admin: true },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2, admin: true },
]

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const visibleNav = role === 'admin' ? nav : nav.filter(item => !item.admin)

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-800">Clínica Gestão</p>
        <p className="text-xs text-gray-400 mt-0.5">Sistema de gestão</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleNav.map(({ href, label, icon: Icon, sub }) => {
          const active = href === '/' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                sub ? 'ml-3 py-1.5' : ''
              } ${active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Icon size={sub ? 14 : 16} />
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
