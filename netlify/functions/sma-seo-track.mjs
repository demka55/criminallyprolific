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
  // Comparison long-tail variants
  "aaa vs the general for high risk drivers",
  "aaa vs the general car insurance which is better",
  "aaa vs the general insurance review",
  "aaa or the general for sr22",
  "is aaa better than the general for bad drivers",
  "american family insurance vs amica which is better",
  "american family vs amica claims satisfaction",
  "amica vs american family for home and auto",
  "american family vs amica customer reviews",
  "is amica better than american family insurance",
  "mercury vs root insurance which is cheaper",
  "mercury car insurance vs root review",
  "root insurance vs mercury auto",
  "mercury vs root for good drivers",
  "is root cheaper than mercury insurance",
  "travelers vs aaa car insurance comparison",
  "is travelers better than aaa insurance",
  "travelers vs aaa which has better rates",
  "aaa vs travelers auto insurance review",
  "travelers insurance vs aaa for homeowners",
  "amica vs safeco car insurance review",
  "is amica better than safeco",
  "safeco vs amica which is cheaper",
  "amica vs safeco claims satisfaction",
  "amica or safeco for home insurance",
  "travelers vs erie insurance claims satisfaction",
  "erie insurance vs travelers which is better",
  "is erie or travelers cheaper",
  "travelers vs erie for home insurance",
  "erie vs travelers customer service comparison",
  "insurify vs policygenius which is better",
  "insurify or policygenius for car insurance",
  "is insurify better than policygenius",
  "policygenius vs insurify auto insurance",
  "insurify policygenius pros cons",
  "erie vs mercury car insurance",
  "is erie insurance cheaper than mercury",
  "mercury insurance vs erie which is better",
  "erie vs mercury for young drivers",
  "usaa vs farmers insurance comparison",
  "is usaa cheaper than farmers insurance",
  "usaa or farmers which is better",
  "usaa vs farmers for military families",
  "farmers insurance vs usaa rates",
  "allstate vs nationwide which is cheaper",
  "nationwide vs allstate car insurance review",
  "is allstate better than nationwide",
  "allstate vs nationwide discount programs",
  "nationwide vs allstate customer service",
  "progressive vs usaa car insurance",
  "is progressive cheaper than usaa",
  "usaa vs progressive for military",
  "progressive vs usaa rates comparison",
  "usaa or progressive which is better for veterans",
  "state farm vs amica car insurance",
  "is state farm cheaper than amica",
  "amica vs state farm claims",
  "state farm vs amica customer satisfaction",
  "amica or state farm which is better",
  "geico vs allstate which is cheaper 2026",
  "is geico better than allstate",
  "allstate vs geico rates comparison",
  "geico or allstate for young drivers",
  "geico vs allstate customer service",
  "geico vs travelers for new drivers",
  "travelers vs geico which is better",
  "is geico or travelers cheaper for young drivers",
  "geico vs travelers claims review",
  "elephant insurance vs geico which is better",
  "is elephant insurance cheaper than geico",
  "elephant vs geico car insurance review",
  "elephant insurance vs geico in texas",
  "elephant auto insurance vs geico rates",
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
  // AI Quick Answers — Month 1 (updated — AIO-starved targets)
  "how much does bad credit raise car insurance",
  "car insurance with bad credit",
  "bad credit car insurance rates",
  "why did my car insurance go up when nothing changed",
  "car insurance went up for no reason",
  "why did my insurance go up without any accidents",
  "will my insurance go up after an accident",
  "how long does insurance go up after accident",
  "is 200 a month too much for car insurance",
  "am i paying too much for car insurance",
  "how much does telematics lower car insurance",
  "does progressive snapshot actually save money",
  "telematics car insurance discount",
  // AI Quick Answers — Month 2 (updated — AIO-starved targets)
  "do i need full coverage on a paid off car",
  "can i drop full coverage on paid off car",
  "when should you drop full coverage car insurance",
  "when to drop full coverage",
  "how long does accident stay on insurance",
  "how long does at fault accident affect insurance",
  "what happens if you get caught without car insurance",
  "driving without insurance fine by state",
  "500 vs 1000 car insurance deductible",
  "should i choose $500 or $1000 deductible",
  // AI Quick Answers — Month 3 (updated — AIO-starved targets)
  "what is sr22 insurance",
  "how long do you need sr22 insurance",
  "sr22 insurance cost",
  "is gap insurance worth it",
  "when to cancel gap insurance",
  "can you switch car insurance at any time",
  "is there a penalty for switching car insurance",
  "car insurance after dui",
  "how much does car insurance go up after dui",
  "what not to say to car insurance adjuster",
  "car insurance claim mistakes to avoid",
  // AI Quick Answer M1 — long-tail variants
  "car insurance rates with 580 credit score",
  "how much more do i pay for insurance with bad credit",
  "car insurance with 600 credit score",
  "does bad credit double car insurance",
  "cheap car insurance despite bad credit",
  "why did my car insurance go up at renewal",
  "car insurance renewal increase no reason",
  "car insurance went up 30 percent at renewal",
  "why did my progressive insurance go up",
  "why did my geico rate increase at renewal",
  "how much does insurance go up after fender bender",
  "will insurance go up after not at fault accident",
  "does insurance go up after hitting a deer",
  "how long until insurance goes back down after accident",
  "will my rates go up if someone hits my parked car",
  "is 150 a month too much for car insurance",
  "is 250 a month too much for car insurance",
  "what is a normal car insurance payment per month",
  "why am i paying $300 a month for car insurance",
  "how to know if you are overpaying for car insurance",
  "does progressive snapshot actually lower rates",
  "how much does drive safe and save actually save",
  "is progressive snapshot worth it",
  "does state farm drive safe and save track location",
  "allstate drivewise how much can you save",
  // Additional long-tail variants — synced from dashboard
  "is savemaxauto legit",
  "save max auto insurance review",
  "save max auto scam",
  "savemaxauto legit or scam",
  "brennan savemaxauto review",
  "insurify or zebra which is better",
  "car insurance comparison tool",
  "insurify car insurance review",
  "insurify legit",
  "car insurance bad credit cost by state",
  "how much more is car insurance with bad credit",
  "car insurance increase at renewal no changes",
  "why is my car insurance increasing without claims",
  "does insurance go up after a claim",
  "how much does insurance go up after accident",
  "insurance rate increase after at fault accident",
  "is $200 a month for car insurance normal",
  "what is a good monthly car insurance rate",
  "average car insurance cost per month 2026",
  "usage based car insurance savings",
  "how much can i save with usage based insurance",
  "full coverage on old car worth it",
  "is full coverage worth it on older car",
  "is full coverage worth it on a 10 year old car",
  "at what car value should i drop full coverage",
  "how old should car be to drop full coverage",
  "when to drop full coverage car insurance",
  "accident on driving record how many years",
  "insurance surcharge how long does it last",
  "how long does car accident stay on your record",
  "no car insurance ticket penalty",
  "uninsured driver penalty by state 2026",
  "what happens if you drive without insurance first offense",
  "$500 vs $1000 deductible car insurance",
  "car insurance deductible which is better",
  "higher deductible lower premium how much",
  "sr-22 how long required by state",
  "sr22 certificate how to get off it",
  "gap insurance should i get it",
  "gap insurance on new car worth it",
  "when does gap insurance make sense",
  "switch car insurance mid policy",
  "cancel car insurance and switch",
  "how to switch car insurance without penalty",
  "cheapest car insurance after dui",
  "dui car insurance rate increase by company",
  "how long does dui affect car insurance",
  "car insurance adjuster tips",
  "what to say to car insurance adjuster after accident",
  "what not to tell car insurance after accident",
  // YouTube Videos
  // https://www.youtube.com/watch?v=U3zlcEFGuo0 — SaveMaxAuto Review
  "save max auto review",
  "is save max auto legit",
  "is savemaxauto a scam",

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

    // One check per keyword per day — skip if checked today (unless force=1 or previous run errored)
    const force = url.searchParams.get('force') === '1'
    const existing = JSON.parse(await store.get(`kw:${slug}`).catch(() => 'null') || 'null')
    if (!force && existing && existing.checkedAt && existing.checkedAt.slice(0, 10) === today && !existing.error) {
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
    const res = await fetch(`https://api.valueserp.com/search?${params}`, { signal: AbortSignal.timeout(9000) })
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
