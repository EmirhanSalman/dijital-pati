import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Public read-only API routes — no session refresh needed. */
const PUBLIC_API_PREFIXES = [
  '/api/map/',
  '/api/lost-pets/public',
  '/api/pet-scans/public',
  '/api/pets/public',
]

function isStaleRefreshTokenError(message: string | undefined): boolean {
  if (!message) return false
  return (
    message.includes('Refresh Token Not Found') ||
    message.includes('Invalid Refresh Token')
  )
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Environment variables kontrolü
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase environment variables bulunamadı!')
    console.error('Lütfen .env.local dosyanızda şu değişkenleri tanımlayın:')
    console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key')
    // Environment variables yoksa middleware'i atla
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Stale/invalid refresh cookie: clear session so public pages stay quiet and
  // protected flows get a clean unauthenticated state (not a hard failure).
  if (authError && isStaleRefreshTokenError(authError.message)) {
    await supabase.auth.signOut()
  }

  // Kullanıcı yoksa ve korumalı route'lardaysa yönlendirme yapılabilir
  // Şimdilik tüm route'lara erişim serbest, sadece session yenileniyor

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
