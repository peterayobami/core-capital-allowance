import type { NextApiRequest, NextApiResponse } from 'next'

const IDS_URL = process.env.IDS_URL!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const idsRes = await fetch(`${IDS_URL}/api/account/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  })

  const data = await idsRes.json().catch(() => null)

  if (!idsRes.ok) {
    return res.status(idsRes.status).json(data ?? { message: 'Verification failed' })
  }

  return res.status(200).json(data)
}
