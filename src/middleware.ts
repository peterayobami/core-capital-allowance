export { default } from 'next-auth/middleware'

export const config = {
  // Protect every route except: NextAuth API routes, onboard API proxies,
  // the registration wizard, the sign-in page, and static assets.
  matcher: ['/((?!api/auth|api/onboard|auth/signin|onboard/register|_next/static|_next/image|favicon.ico).*)'],
}
