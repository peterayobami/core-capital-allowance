import type { NextApiRequest, NextApiResponse } from 'next'

const IDS_URL = process.env.IDS_URL!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const idsRes = await fetch(`${IDS_URL}/api/account/send-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  })

  if (!idsRes.ok) {
    const error = await idsRes.json().catch(() => ({ message: 'Failed to send verification code' }))
    return res.status(idsRes.status).json(error)
  }

  return res.status(200).end()
}
