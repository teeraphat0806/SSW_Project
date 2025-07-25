import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const user = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const pathname = request.nextUrl.pathname

  if (
    pathname.startsWith('/superadminDashboard') &&
    (!user || user.role !== 'superadmin')
  ) {
    return NextResponse.redirect(new URL('/notFound', request.url))
  }

  return NextResponse.next()
}
