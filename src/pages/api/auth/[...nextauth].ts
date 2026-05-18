import NextAuth, { type NextAuthOptions } from 'next-auth'

const IDS_URL = process.env.IDS_URL!

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'bechellente-ids',
      name: 'Bechellente Identity',
      type: 'oauth',
      wellKnown: `${IDS_URL}/.well-known/openid-configuration`,
      clientId: process.env.IDS_CLIENT_ID!,
      clientSecret: process.env.IDS_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: process.env.IDS_SCOPE ?? 'openid profile tenant offline_access',
          response_type: 'code',
        },
      },
      checks: ['pkce', 'state'],
      idToken: true,
      profile(profile) {
        return {
          id: profile.sub as string,
          name: profile.name as string | null,
          email: profile.email as string | null,
          image: null,
        }
      },
    },
  ],

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/auth/signin',
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allow redirecting to IDS — required for RP-Initiated Logout via callbackUrl
      if (url.startsWith(IDS_URL)) return url
      // Standard NextAuth behaviour for everything else
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    },

    async jwt({ token, account, profile }) {
      // Persist tokens and tenant claim on first sign-in
      if (account && profile) {
        return {
          ...token,
          accessToken: account.access_token as string,
          idToken: account.id_token as string | undefined,
          refreshToken: account.refresh_token as string | undefined,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : undefined,
          tenantId: (profile as { tenant_id?: string }).tenant_id ?? '',
        }
      }

      // Return token as-is if not expired
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token
      }

      // Token expired — attempt refresh
      return refreshAccessToken(token)
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.idToken = token.idToken
      session.tenantId = token.tenantId
      session.error = token.error
      return session
    },
  },
}

async function refreshAccessToken(token: Parameters<NonNullable<NextAuthOptions['callbacks']>['jwt']>[0]['token']) {
  try {
    const response = await fetch(`${IDS_URL}/connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.IDS_CLIENT_ID!,
        client_secret: process.env.IDS_CLIENT_SECRET!,
        refresh_token: token.refreshToken ?? '',
      }),
    })

    const refreshed = await response.json()

    if (!response.ok) throw refreshed

    return {
      ...token,
      accessToken: refreshed.access_token as string,
      refreshToken: (refreshed.refresh_token as string | undefined) ?? token.refreshToken,
      accessTokenExpires: Date.now() + (refreshed.expires_in as number) * 1000,
    }
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' as const }
  }
}

export default NextAuth(authOptions)
