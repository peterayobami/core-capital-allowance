import { useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

// Triggers the IDS OAuth flow — but only after useSession() has resolved,
// so we never fire the OIDC redirect while the session status is still
// "loading". This prevents a race where a stale IDS session silently
// re-authenticates before the cookie-clearing Set-Cookie from the logout
// response has been fully processed.
export default function SignIn() {
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    // Wait until NextAuth has finished reading (or not finding) the session
    // cookie. Calling signIn() while status is "loading" can race with the
    // IDS session cookie being cleared by the logout redirect response.
    if (status !== 'unauthenticated') return

    const callbackUrl = (router.query.callbackUrl as string) ?? '/dashboard'
    signIn('bechellente-ids', { callbackUrl })
  }, [status, router.query.callbackUrl])

  return null
}
