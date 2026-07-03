// netlify/functions/sma-auth.mjs
// Auth endpoint for SaveMaxAuto dashboard
// Reads SAVEMAXADMIN environment variable

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: H })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: H })

  try {
    const body = await req.json()
    const pw = body.password || ''
    const adminPw = Netlify.env.get('SAVEMAXADMIN') || ''

    if (!adminPw) {
      return new Response(JSON.stringify({ error: 'SAVEMAXADMIN env var not set' }), { status: 500, headers: H })
    }

    if (pw === adminPw) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: H })
    } else {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: H })
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: H })
  }
}

export const config = { path: '/api/sma-auth', method: ['POST', 'OPTIONS'] }
