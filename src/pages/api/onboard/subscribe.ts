import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

const SUBSCRIPTION_URL = process.env.SUBSCRIPTION_URL!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = await getToken({ req })
  if (!token?.accessToken) return res.status(401).json({ message: 'Unauthorized' })

  const upstream = await fetch(`${SUBSCRIPTION_URL}/api/subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.accessToken}`,
    },
    body: JSON.stringify(req.body),
  })

  const data = await upstream.json().catch(() => null)

  if (!upstream.ok) {
    return res.status(upstream.status).json(data ?? { message: 'Subscription creation failed' })
  }

  return res.status(201).json(data)
}
