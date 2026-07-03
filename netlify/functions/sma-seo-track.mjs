// netlify/functions/sma-seo-track.mjs
// SEO tracking API for savemaxauto.com
// Separate from IRS/CP instances — uses own blob store and keyword list
// GET /api/sma-seo-track?action=results             — stored results (public)
// GET /api/sma-seo-track?action=check&kw=X&password — check ONE keyword
// GET /api/sma-seo-track?action=finish&password     — assemble summary

import { getStore } from '@netlify/blobs'

const STORE       = 'sma-seo-tracking'
const RESULTS_KEY = 'latest-results'
const HISTORY_KEY = 'history'
const SITE        = 'savemaxauto.com'

const KEYWORDS = [
  // Brand / Trust
  "is save max auto legit",
  "savemaxauto review",
  "save max auto insurance reviews",
  "savemaxauto.com",
  "save max auto legit",
  "is savemax auto legit",
  "savemaxauto scam",
  "is savemaxauto a scam",
  "save max auto reviews",
  "savemaxauto",
  "save max auto",
  // Comparison Pages
  "insurify vs zebra",
  "insurify vs policygenius",
  "mercury vs root insurance",
  "aaa vs the general",
  "american family vs amica",
  "amica vs safeco",
  "erie vs mercury insurance",
  "travelers vs erie insurance",
  "usaa vs farmers insurance",
  "travelers vs aaa",
  "allstate vs nationwide",
  "liberty mutual vs progressive",
  "state farm vs amica",
  "geico vs allstate",
  "progressive vs usaa",
  "state farm vs liberty mutual",
  "geico vs state farm claims",
  // Local — Las Vegas
  "auto insurance las vegas",
  "cheap auto insurance las vegas",
  "car insurance las vegas",
  "cheapest car insurance las vegas",
  "las vegas car insurance rates",
  // Cheap Insurance
  "cheap insurance",
  "cheap car insurance",
  "cheapest car insurance",
  "cheap auto insurance",
  "low cost car insurance",
  "affordable car insurance",
  // EV Insurance
  "cheapest electric cars to insure",
  "electric car insurance cost",
  "are electric cars more expensive to insure",
  "ev insurance cost",
  "tesla model y insurance cost by state",
  "ev battery replacement cost",
  "how much does it cost to insure an electric car",
  // AI Quick Answers — Month 1
  "does your credit score affect car insurance",
  "does credit score affect car insurance",
  "why did my car insurance go up",
  "will my insurance go up after an accident",
  "how much is car insurance per month",
  "is 200 a month too much for car insurance",
  "how can i lower my car insurance",
  "ways to lower car insurance",
  // AI Quick Answers — Month 2
  "what is liability car insurance",
  "how much liability car insurance do i need",
  "what is full coverage car insurance",
  "is full coverage worth it",
  "how long does accident stay on insurance",
  "what happens if you drive without insurance",
  "how does car insurance deductible work",
  "500 vs 1000 deductible car insurance",
  // AI Quick Answers — Month 3
  "what is sr22 insurance",
  "how long do you need sr22 insurance",
  "is gap insurance worth it",
  "how to switch car insurance",
  "car insurance after dui",
  "how much does car insurance go up after dui",
  "how to file a car insurance claim",
  // YouTube Videos
  // https://www.youtube.com/watch?v=U3zlcEFGuo0 — SaveMaxAuto Review
  "save max auto review",
  "is save max auto legit",
  "is savemaxauto a scam",
  "savemaxauto legit",
  // https://www.youtube.com/watch?v=mUVrZmdeZbE — Insurify vs Zebra
  "insurify vs zebra",
  "insurify vs the zebra",
  "zebra vs insurify",
  "best car insurance comparison site",
  "compare car insurance rates online",
  // https://www.youtube.com/watch?v=fONdmO8uyJU — Insurify Review
  "insurify review",
  "is insurify legit",
  "insurify insurance reviews",
  "how does insurify work",
  "insurify legit or scam",
]

const H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}
const ok       = (d)    => new Response(JSON.stringify(d), { status: 200, headers: H })
const fail     = (m, s) => new Response(JSON.stringify({ error: m }), { status: s||500, headers: H })
const tryParse = (r)    => { try { return r ? JSON.parse(r) : null } catch { return null } }

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: H })

  const url    = new URL(req.url)
  const action = url.searchParams.get('action') || 'results'
  const pw     = url.searchParams.get('password') || ''

  const ADMIN_PW = Netlify.env.get('SAVEMAXADMIN') || ''
  const API_KEY  = Netlify.env.get('VALUESERP_API') || ''

  if (action === 'keywords') return ok({ keywords: KEYWORDS })

  if (action === 'results') {
    try {
      const store = getStore(STORE)
      const [raw, histRaw] = await Promise.all([
        store.get(RESULTS_KEY).catch(() => null),
        store.get(HISTORY_KEY).catch(() => null),
      ])
      const stored = tryParse(raw)
      const kwResults = []
      for (const kw of KEYWORDS) {
        const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
        const kwRaw = await store.get(`kw:${slug}`).catch(() => null)
        const kwData = tryParse(kwRaw)
        if (kwData) {
          // Attach per-keyword history if not already present
          if (!kwData.history) {
            const histRaw = await store.get(`kw-hist:${slug}`).catch(() => null)
            kwData.history = tryParse(histRaw) || []
          }
          kwResults.push(kwData)
        }
      }
      let results = stored
      if (kwResults.length > 0) {
        const summaryDate = stored?.checkedAt || '2000-01-01'
        const latestKw = kwResults.reduce((latest, r) =>
          (r.checkedAt || '') > latest ? (r.checkedAt || '') : latest, '')
        if (!stored || latestKw > summaryDate || kwResults.length === KEYWORDS.length) {
          const inAio  = kwResults.filter(r => r.in_aio).length
          const cited  = kwResults.filter(r => r.site_cited).length
          const ranked = kwResults.filter(r => r.our_pages && r.our_pages.length > 0).length
          results = {
            checkedAt: latestKw,
            partial: kwResults.length < KEYWORDS.length,
            summary: { total: kwResults.length, in_aio: inAio, site_cited: cited, ranked },
            keywords: kwResults,
          }
        }
      }
      return ok({ results, history: tryParse(histRaw) || [] })
    } catch (e) {
      return ok({ results: null, history: [], error: e.message })
    }
  }

  if (!pw || pw !== ADMIN_PW) return fail('Unauthorized', 401)
  if (!API_KEY) return fail('VALUESERP_API not configured', 500)

  if (action === 'check') {
    const kw = url.searchParams.get('kw') || ''
    if (!kw) return fail('Missing kw param', 400)

    const store = getStore(STORE)
    const slug  = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
    const today = new Date().toISOString().slice(0, 10)

    // One check per keyword per day — return cached if already checked today
    const existing = JSON.parse(await store.get(`kw:${slug}`).catch(() => 'null') || 'null')
    if (existing && existing.checkedAt && existing.checkedAt.slice(0, 10) === today) {
      return ok({ ...existing, skipped: true, reason: 'already_checked_today' })
    }

    const result = await checkKeyword(kw, API_KEY)

    // Append to per-keyword history (keep last 30 days)
    const histRaw = await store.get(`kw-hist:${slug}`).catch(() => null)
    let kwHist = []
    try { kwHist = histRaw ? JSON.parse(histRaw) : [] } catch {}
    kwHist.unshift({ date: today, organic_rank: result.organic_rank || null, in_aio: result.in_aio, site_cited: result.site_cited })
    if (kwHist.length > 30) kwHist = kwHist.slice(0, 30)
    await store.set(`kw-hist:${slug}`, JSON.stringify(kwHist)).catch(() => {})

    // Attach history to result for client display
    result.history = kwHist

    await store.set(`kw:${slug}`, JSON.stringify(result)).catch(() => {})
    return ok(result)
  }

  if (action === 'finish') {
    try {
      const store     = getStore(STORE)
      const checkedAt = new Date().toISOString()
      const results   = []
      for (const kw of KEYWORDS) {
        const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
        const r    = tryParse(await store.get(`kw:${slug}`).catch(() => null))
        results.push(r || { keyword: kw, error: 'no data', our_pages: [], in_aio: false, site_cited: false })
      }
      const inAio  = results.filter(r => r.in_aio).length
      const cited  = results.filter(r => r.site_cited).length
      const ranked = results.filter(r => r.our_pages && r.our_pages.length > 0).length
      const data   = { checkedAt, summary: { total: results.length, in_aio: inAio, site_cited: cited, ranked }, keywords: results }
      await store.set(RESULTS_KEY, JSON.stringify(data))
      let history = tryParse(await store.get(HISTORY_KEY).catch(() => null)) || []
      history.unshift({ date: checkedAt.slice(0, 10), in_aio: inAio, site_cited: cited, total: results.length })
      if (history.length > 30) history = history.slice(0, 30)
      await store.set(HISTORY_KEY, JSON.stringify(history))
      return ok({ ok: true, summary: data.summary })
    } catch (e) { return fail(e.message) }
  }

  return fail('Unknown action', 400)
}


async function checkKeyword(keyword, apiKey) {
  const result = {
    keyword, in_aio: false, site_cited: false,
    aio_text: null, aio_sources: [], our_pages: [],
    organic_rank: null, error: null,
    checkedAt: new Date().toISOString(),
  }
  try {
    const params = new URLSearchParams({
      api_key: apiKey, q: keyword, engine: 'google',
      google_domain: 'google.com', gl: 'us', hl: 'en',
      device: 'desktop', include_ai_overview: 'true', num: '10',
    })
    const res = await fetch(`https://api.valueserp.com/search?${params}`)
    if (!res.ok) {
      let e = `ValueSERP HTTP ${res.status}`
      try { const t = await res.text(); if (t) e += ': ' + t.slice(0, 150) } catch {}
      result.error = e; return result
    }
    let data
    try {
      const text = await res.text()
      if (!text?.trim()) { result.error = 'Empty response'; return result }
      data = JSON.parse(text)
    } catch (e) { result.error = 'Parse error: ' + e.message; return result }

    const pageToken = data.page_token || data.ai_overview?.page_token
    if (pageToken && !(data.ai_overview?.text_blocks?.length) && !(data.ai_overview?.snippet)) {
      try {
        const tRes = await fetch(`https://api.valueserp.com/search?api_key=${encodeURIComponent(apiKey)}&page_token=${encodeURIComponent(pageToken)}`)
        if (tRes.ok) {
          const tText = await tRes.text()
          if (tText?.trim()) {
            const tData = JSON.parse(tText)
            if (tData.ai_overview) data.ai_overview = tData.ai_overview
          }
        }
      } catch {}
    }

    const aio = data.ai_overview
    if (aio) {
      result.in_aio = true
      const parts = []
      if (aio.text_blocks) {
        for (const b of aio.text_blocks) {
          if (b.snippet) parts.push(b.snippet)
          if (b.list) for (const item of b.list) if (item.snippet) parts.push('• ' + item.snippet)
        }
      }
      if (!parts.length && aio.snippet) parts.push(aio.snippet)
      result.aio_text = parts.join('\n\n').slice(0, 3000) || null
      const srcs = [...(aio.ai_overview_sources||[]), ...(aio.sources||[]), ...(aio.references||[])]
      result.aio_sources = srcs.map(s => ({ title: s.title||s.name||'', link: s.link||s.url||'' })).filter(s => s.link).slice(0, 10)
      result.site_cited = result.aio_sources.some(s => s.link.includes(SITE)) || JSON.stringify(aio).toLowerCase().includes(SITE)
      if (result.site_cited) {
        const ours = result.aio_sources.filter(s => s.link.includes(SITE))
        ours.length
          ? ours.forEach(p => result.our_pages.push({ where: 'AIO source', link: p.link, title: p.title }))
          : result.our_pages.push({ where: 'AIO mention', link: '', title: 'Domain mentioned in AIO text' })
      }
    }

    ;(data.organic_results || []).forEach((r, i) => {
      if (r.link?.includes(SITE)) {
        const pos = r.position || i + 1
        if (!result.organic_rank || pos < result.organic_rank) result.organic_rank = pos
        result.our_pages.push({ where: `Organic #${pos}`, link: r.link, title: r.title || '' })
      }
    })

    if (!result.our_pages.length && JSON.stringify(data).toLowerCase().includes(SITE))
      result.our_pages.push({ where: 'SERP mention', link: '', title: 'Found in raw response' })

  } catch (e) { result.error = e.message }
  return result
}
