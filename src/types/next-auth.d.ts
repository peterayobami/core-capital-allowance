import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    idToken?: string
    tenantId: string
    error?: 'RefreshAccessTokenError'
  }

  interface Profile {
    tenant_id?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
    idToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    tenantId: string
    error?: 'RefreshAccessTokenError'
  }
}
