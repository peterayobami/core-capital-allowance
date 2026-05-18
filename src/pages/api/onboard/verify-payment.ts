import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

const PAYMENT_URL = process.env.PAYMENT_URL!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const token = await getToken({ req })
  if (!token?.accessToken) return res.status(401).json({ message: 'Unauthorized' })

  const { reference } = req.query
  if (!reference) return res.status(400).json({ message: 'reference is required' })

  const upstream = await fetch(`${PAYMENT_URL}/api/payment/verify/${reference}`, {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  })

  const data = await upstream.json().catch(() => null)

  if (!upstream.ok) {
    return res.status(upstream.status).json(data ?? { message: 'Payment verification failed' })
  }

  return res.status(200).json(data)
}
