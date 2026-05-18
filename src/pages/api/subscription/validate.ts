import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

const SUBSCRIPTION_URL = process.env.SUBSCRIPTION_URL!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const token = await getToken({ req })
  if (!token?.accessToken) return res.status(401).json({ message: 'Unauthorized' })

  const upstream = await fetch(`${SUBSCRIPTION_URL}/api/subscription/validate`, {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  })

  const data = await upstream.json().catch(() => null)
  return res.status(upstream.status).json(data ?? {})
}
