// Auth guard intentionally disabled: every route is publicly accessible.
// The original next-auth middleware is preserved in version control; re-enable
// by restoring the previous export and matcher when auth is required again.
//
// Previous implementation:
//   export { default } from 'next-auth/middleware'
//   export const config = {
//     matcher: ['/((?!api/auth|api/onboard|auth/signin|onboard/register|_next/static|_next/image|favicon.ico).*)'],
//   }
import { NextResponse } from 'next/server'

export default function middleware() {
  return NextResponse.next()
}

// Empty matcher → middleware never runs.
export const config = {
  matcher: [],
}
