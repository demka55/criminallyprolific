// netlify/functions/seo-api.mjs
// GET /api/seo-track?action=keywords            — list all 19 keywords (public)
// GET /api/seo-track?action=results             — stored results (public)
// GET /api/seo-track?action=check&kw=X&password — check ONE keyword, store + return
// GET /api/seo-track?action=finish&password     — assemble final summary from kw: blobs
// Browser calls check() for each keyword sequentially — no server-side loop needed

import { getStore } from '@netlify/blobs'

const STORE       = 'cp-seo-tracking'
const RESULTS_KEY = 'latest-results'
const HISTORY_KEY = 'history'
const SITE        = 'criminallyprolific.com'

const KEYWORDS = [
  // /company-boilerplate/
  "company boilerplate",
  "company boilerplate examples",
  "boilerplate",
  "boilerplate content",
  "what is a boilerplate",
  "press release boilerplate",
  "about the company boilerplate",
  "boilerplate template",
  "company description template",
  "boiler plate",
  // /cold-email-example/
  "cold email example",
  "cold email examples",
  "cold email",
  "best cold email examples",
  "cold email template",
  "cold email tips",
  "cold email 2026",
  "cold email outreach examples",
  // /press-release-email/
  "press release email example",
  "press release email",
  "press release subject line",
  "subject line for press release email",
  "how to send a press release email",
  "press release email template",
  "media pitch email",
  // /find-anyones-email/
  "find anyones email",
  "find email address by name free",
  "find all emails associated with my name free",
  "how to find email address by name",
  "find email address free",
  "email lookup by name",
  "find anyone email address free",
  // /email-signatures/
  "email signature examples",
  "email signature ideas",
  "professional email signature",
  "best email signature examples",
  "email signature template",
  "good email signature",
  "email signature 2026",
  // /how-to-pitch-journalists/
  "how to pitch journalists",
  "pitch journalists",
  "how to pitch a journalist",
  "journalist pitch template",
  "media pitch",
  "how to pitch to press",
  // /pr-pitch-angles/
  "pr pitch angles",
  "pitch angles for journalists",
  "pr pitch ideas",
  "unusual pr pitch angles",
  "creative pr pitch",
  // /pr-for-startups/
  "pr for startups",
  "startup pr",
  "how to do pr for a startup",
  "startup press coverage",
  "startup media coverage",
  "how to get press coverage startup",
  // /saas-pr/
  "saas pr",
  "saas pr strategy",
  "saas public relations",
  "b2b saas pr",
  "saas press coverage",
  // /do-your-own-pr/
  "do your own pr",
  "diy pr",
  "how to do your own pr",
  "pr without a pr agency",
  "how to get press coverage without pr agency",
  // /media-relations-strategy/
  "media relations strategy",
  "media relations",
  "pr media strategy",
  "how to build media relationships",
  "journalist relationship building",
  // /media-list-examples/
  "media list examples",
  "media list",
  "how to build a media list",
  "journalist contact list",
  "pr media list template",
  // /marketing-communications-strategy/
  "marketing communications strategy",
  "marketing communications",
  "marcom strategy",
  "integrated marketing communications",
  // /how-to-rank-higher-on-google/
  "how to rank higher on google",
  "rank higher on google",
  "link building study",
  "how to rank on google",
  "google ranking tips 2026",
  // /optimize-for-google-rankbrain/
  "optimize for google rankbrain",
  "rankbrain seo",
  "google rankbrain optimization",
  "rankbrain ranking factors",
  // /ranking-high-volume-keyword/
  "how to rank for high volume keywords",
  "ranking high volume keyword",
  "rank competitive keyword 90 days",
  "rank difficult keyword",
  // /low-search-volume-keywords/
  "low search volume keywords",
  "long tail keywords strategy",
  "low volume keyword seo",
  "why target low volume keywords",
  // /growth-hacking/
  "growth hacking",
  "growth hacking tactics",
  "growth hacking examples",
  "growth hacking strategies 2026",
  "growth hacking tools",
  // /50-growth-hacking-tools/
  "growth hacking tools",
  "best growth hacking tools",
  "marketing growth tools",
  "growth tools for startups",
  "50 growth hacking tools",
  // /convert-website-visitors/
  "how to convert website visitors",
  "convert website visitors without forms",
  "website visitor conversion",
  "increase website conversion rate",
  // /waste-money-on-facebook-ads/
  "are facebook ads worth it",
  "facebook ads worth it 2026",
  "waste money on facebook ads",
  "facebook ads roi 2026",
  "should i use facebook ads",
  // /email-pitch-tips/
  "email pitch tips",
  "cold email pitch",
  "how to pitch journalists by email",
  "pr email tips",
  "email pitch to journalist",
  // /email-subject-lines/
  "cold email subject lines",
  "email subject lines that get responses",
  "best email subject lines",
  "subject lines for cold email",
  "email subject line examples",
  // /email-signoffs/
  "email sign offs",
  "best email sign offs",
  "professional email sign off",
  "email closing examples",
  "how to end an email",
  // /business-email-templates/
  "business email templates",
  "professional email templates",
  "business email examples",
  "email templates for business",
  "formal email template",
  // /sales-email-sequences/
  "sales email sequences",
  "email sequence examples",
  "cold email sequence",
  "sales email drip sequence",
  "best sales email sequences",
  // /gmail-mail-merge/
  "gmail mail merge",
  "mail merge gmail",
  "how to mail merge in gmail",
  "gmail mail merge 2026",
  "send personalized emails gmail",
  // /grow-email-list/
  "how to grow email list",
  "grow email list fast",
  "email list building",
  "grow newsletter subscribers",
  "build email list from scratch",
  // /grow-email-subscribers/
  "grow email subscribers",
  "increase email subscribers",
  "how to get more email subscribers",
  "700 to 3000 subscribers",
  "grow newsletter fast",
  // /how-to-ask-for-business-in-an-email/
  "how to ask for business in an email",
  "ask for business email template",
  "sales ask email",
  "how to ask for a sale in email",
  "closing email for business",
  // /pitch-sell-your-app/
  "how to pitch an app",
  "how to sell your app",
  "pitch app to investors",
  "sell saas app",
  "build app for acquisition",
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

  const ADMIN_PW = Netlify.env.get('ADMIN_PASSWORD') || ''
  const API_KEY  = Netlify.env.get('VALUESERP_API')  || ''

  // ── Public endpoints ──────────────────────────────────────────────────────
  if (action === 'keywords') return ok({ keywords: KEYWORDS })

  if (action === 'results') {
    try {
      const store = getStore(STORE)
      const [raw, histRaw] = await Promise.all([
        store.get(RESULTS_KEY).catch(() => null),
        store.get(HISTORY_KEY).catch(() => null),
      ])
      const stored = tryParse(raw)
      
      // Also read all individual kw: blobs to find any newer results
      const kwResults = []
      for (const kw of KEYWORDS) {
        const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
        const kwRaw = await store.get(`kw:${slug}`).catch(() => null)
        const kwData = tryParse(kwRaw)
        if (kwData) kwResults.push(kwData)
      }
      
      // If we have individual results newer than the summary, return them merged
      let results = stored
      if (kwResults.length > 0) {
        const summaryDate = stored?.checkedAt || '2000-01-01'
        const latestKw = kwResults.reduce((latest, r) => 
          (r.checkedAt || '') > latest ? (r.checkedAt || '') : latest, '')
        
        // Individual blobs are newer — use them (partial or complete run)
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

  // ── Auth required ─────────────────────────────────────────────────────────
  if (!pw || pw !== ADMIN_PW) return fail('Unauthorized', 401)
  if (!API_KEY) return fail('VALUESERP_API not configured in Netlify env vars', 500)

  // ── Check ONE keyword ─────────────────────────────────────────────────────
  if (action === 'check') {
    const kw = url.searchParams.get('kw') || ''
    if (!kw) return fail('Missing kw param', 400)

    const store = getStore(STORE)
    const slug  = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
    const today = new Date().toISOString().slice(0, 10)

    // One check per keyword per day
    const existing = JSON.parse(await store.get(`kw:${slug}`).catch(() => 'null') || 'null')
    if (existing && existing.checkedAt && existing.checkedAt.slice(0, 10) === today) {
      return ok({ ...existing, skipped: true, reason: 'already_checked_today' })
    }

    const result = await checkKeyword(kw, API_KEY)

    // Per-keyword history (30 days)
    const histRaw = await store.get(`kw-hist:${slug}`).catch(() => null)
    let kwHist = []
    try { kwHist = histRaw ? JSON.parse(histRaw) : [] } catch {}
    kwHist.unshift({ date: today, organic_rank: result.organic_rank || null, in_aio: result.in_aio, site_cited: result.site_cited })
    if (kwHist.length > 30) kwHist = kwHist.slice(0, 30)
    await store.set(`kw-hist:${slug}`, JSON.stringify(kwHist)).catch(() => {})
    result.history = kwHist

    await store.set(`kw:${slug}`, JSON.stringify(result)).catch(() => {})
    return ok(result)
  }

  // ── Finish: assemble summary from stored kw: blobs ────────────────────────
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


// ── Check one keyword — handles page_token for deferred AIO ──────────────────
// No client-side timeout — let ValueSERP take up to 60s per Google's recommendation
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
      try {
        const t = await res.text()
        if (t) { try { e += ': ' + (JSON.parse(t).message || t.slice(0, 150)) } catch { e += ': ' + t.slice(0, 150) } }
      } catch {}
      result.error = e
      return result
    }

    let data
    try {
      const text = await res.text()
      if (!text?.trim()) { result.error = 'Empty response'; return result }
      data = JSON.parse(text)
    } catch (e) { result.error = 'Parse error: ' + e.message; return result }

    // ── page_token: AIO was deferred — follow up immediately ─────────────
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
      } catch (e) {
        console.warn('[seo-api] page_token follow-up failed:', e.message)
      }
    }

    // ── Parse AI Overview ─────────────────────────────────────────────────
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
      result.aio_sources = srcs
        .map(s => ({ title: s.title||s.name||'', link: s.link||s.url||'' }))
        .filter(s => s.link).slice(0, 10)
      result.site_cited = result.aio_sources.some(s => s.link.includes(SITE)) ||
                          JSON.stringify(aio).toLowerCase().includes(SITE)

      if (result.site_cited) {
        const ours = result.aio_sources.filter(s => s.link.includes(SITE))
        ours.length
          ? ours.forEach(p => result.our_pages.push({ where: 'AIO source', link: p.link, title: p.title }))
          : result.our_pages.push({ where: 'AIO mention', link: '', title: 'Domain mentioned in AIO text' })
      }
    }

    // ── Organic results ───────────────────────────────────────────────────
    ;(data.organic_results || []).forEach((r, i) => {
      if (r.link?.includes(SITE)) {
        const pos = r.position || i + 1
        if (!result.organic_rank || pos < result.organic_rank) result.organic_rank = pos
        result.our_pages.push({ where: `Organic #${pos}`, link: r.link, title: r.title || '' })
      }
    })

    // ── Everything else: top stories, local, knowledge graph ─────────────
    const extras = [
      ...(data.top_stories || []),
      ...(data.local_results || []),
      ...((data.knowledge_graph?.links) || []),
    ]
    extras.forEach(item => {
      const link = item.link || item.url || ''
      if (link.includes(SITE)) result.our_pages.push({ where: 'Other result', link, title: item.title || '' })
    })

    // ── Final catch-all ───────────────────────────────────────────────────
    if (!result.our_pages.length && JSON.stringify(data).toLowerCase().includes(SITE))
      result.our_pages.push({ where: 'SERP mention', link: '', title: 'Found in raw response' })

  } catch (e) { result.error = e.message }
  return result
}
