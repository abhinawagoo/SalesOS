import { type NextRequest, NextResponse } from 'next/server'

// AUTH BYPASSED — demo mode active
// Restore auth by importing updateSession from @/lib/supabase/middleware
export function proxy(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
