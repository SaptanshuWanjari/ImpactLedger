import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublishableKey } from './env'
import { isRbacEnabled } from '@/lib/config/rbac'

const PROTECTED_PATH_PREFIXES = ['/admin', '/donor', '/volunteer']
const PROTECTED_API_PREFIXES = ['/api/admin', '/api/donor', '/api/volunteer']

const ROLE_ALLOWED_PREFIXES: Record<string, string[]> = {
  org_admin: ['/admin'],
  volunteer: ['/volunteer'],
  donor: ['/donor'],
}

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function roleHomePath(role: string | null) {
  if (role === 'volunteer') return '/volunteer'
  if (role === 'org_admin') return '/admin'
  return '/donor'
}

function isStaleSessionError(error: unknown) {
  const code = typeof error === 'object' && error !== null ? String((error as { code?: string }).code || '') : ''
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase()

  return (
    code === 'refresh_token_not_found' ||
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('auth session missing')
  )
}

function isSupabaseNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase()
  const causeCode =
    typeof error === 'object' && error !== null
      ? String(((error as { cause?: { code?: string } }).cause?.code as string) || '')
      : ''

  return (
    message.includes('fetch failed') ||
    message.includes('connect timeout') ||
    causeCode === 'UND_ERR_CONNECT_TIMEOUT'
  )
}

function clearSupabaseCookies(request: NextRequest, response: NextResponse) {
  const allCookies = request.cookies.getAll()
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', { path: '/', maxAge: 0 })
    }
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  let staleSessionDetected = false

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  const pathname = request.nextUrl.pathname
  const authRequired = startsWithAny(pathname, PROTECTED_PATH_PREFIXES) || startsWithAny(pathname, PROTECTED_API_PREFIXES)

  if (!authRequired || !isRbacEnabled()) {
    return supabaseResponse
  }

  let claims: any = null
  let userId: string | null = null

  try {
    const { data } = await supabase.auth.getClaims()
    claims = data?.claims as any
    userId = claims?.sub || null
  } catch (error) {
    if (isStaleSessionError(error)) {
      staleSessionDetected = true
      userId = null
    } else if (isSupabaseNetworkError(error)) {
      if (startsWithAny(pathname, PROTECTED_API_PREFIXES)) {
        return NextResponse.json({ error: 'Authentication service unavailable.' }, { status: 503 })
      }

      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('error', 'Authentication service unavailable. Please retry.')
      return NextResponse.redirect(url)
    } else {
      throw error
    }
  }

  if (!userId) {
    if (startsWithAny(pathname, PROTECTED_API_PREFIXES)) {
      const response = NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
      if (staleSessionDetected) {
        clearSupabaseCookies(request, response)
      }
      return response
    }

    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)
    const response = NextResponse.redirect(url)
    if (staleSessionDetected) {
      clearSupabaseCookies(request, response)
    }
    return response
  }

  const role = (claims?.app_metadata?.app_role || null) as string | null

  if (!role) {
    if (startsWithAny(pathname, PROTECTED_API_PREFIXES)) {
      return NextResponse.json({ error: 'No tenant role assigned.' }, { status: 403 })
    }

    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('error', 'No tenant role assigned.')
    return NextResponse.redirect(url)
  }

  const allowedPrefixes = ROLE_ALLOWED_PREFIXES[role] || []
  const isProtectedPage = startsWithAny(pathname, PROTECTED_PATH_PREFIXES)
  const isProtectedApi = startsWithAny(pathname, PROTECTED_API_PREFIXES)

  if (isProtectedPage && !startsWithAny(pathname, allowedPrefixes)) {
    const url = request.nextUrl.clone()
    url.pathname = roleHomePath(role)
    return NextResponse.redirect(url)
  }

  if (isProtectedApi && !startsWithAny(pathname, allowedPrefixes.map((p) => `/api${p}`))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  return supabaseResponse
}
