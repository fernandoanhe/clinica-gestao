import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const VENDEDOR_ROUTES = ['/agenda', '/vendas', '/clientes']

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    const userResult = await Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null } }>(resolve =>
        setTimeout(() => resolve({ data: { user: null } }), 5000)
      ),
    ])

    const user = userResult.data.user

    if (!user && !request.nextUrl.pathname.startsWith('/auth')) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    if (user && !request.nextUrl.pathname.startsWith('/auth')) {
      const { data: perfil } = await supabase
        .from('perfis')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = perfil?.role || 'vendedor'
      const pathname = request.nextUrl.pathname

      if (role === 'vendedor') {
        const permitido = VENDEDOR_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
        if (!permitido && pathname !== '/') {
          const url = request.nextUrl.clone()
          url.pathname = '/vendas'
          return NextResponse.redirect(url)
        }
        if (pathname === '/') {
          const url = request.nextUrl.clone()
          url.pathname = '/vendas'
          return NextResponse.redirect(url)
        }
      }

      supabaseResponse.headers.set('x-user-role', role)
    }
  } catch {
    if (!request.nextUrl.pathname.startsWith('/auth')) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
