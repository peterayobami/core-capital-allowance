import type { NextApiRequest, NextApiResponse } from 'next'

const SUBSCRIPTION_URL = process.env.SUBSCRIPTION_URL!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { productCode } = req.query
  if (!productCode) return res.status(400).json({ message: 'productCode is required' })

  const upstream = await fetch(
    `${SUBSCRIPTION_URL}/api/plans?productCode=${productCode}`,
    { headers: { 'Content-Type': 'application/json' } }
  )

  const data = await upstream.json().catch(() => null)

  if (!upstream.ok) {
    return res.status(upstream.status).json(data ?? { message: 'Failed to fetch plans' })
  }

  return res.status(200).json(data)
}
