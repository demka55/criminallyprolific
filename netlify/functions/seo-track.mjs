// netlify/functions/seo-track.mjs
// Scheduled function ONLY — runs daily at 6am UTC
// NO path — calls the same checkKeyword logic inline (no cross-import)

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

export default async () => {
  const API_KEY = Netlify.env.get('VALUESERP_API') || ''
  try {
    await runChecks(API_KEY)
    console.log('[seo-track] Daily check complete')
  } catch (err) {
    console.error('[seo-track] Failed:', err.message)
  }
}

export const config = { schedule: '0 6 * * *' }

async function runChecks(apiKey) {
  const store     = getStore(STORE)
  const checkedAt = new Date().toISOString()
  const results   = []
  const BATCH = 5
  for (let i = 0; i < KEYWORDS.length; i += BATCH) {
    const batch = KEYWORDS.slice(i, i + BATCH)
    const batchResults = await Promise.all(batch.map(kw => checkKeyword(kw, apiKey)))
    results.push(...batchResults)
    await Promise.all(batchResults.map(async (r) => {
      const slug = r.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
      try { await store.set(`kw:${slug}`, JSON.stringify(r)) } catch {}
    }))
  }
  const inAio = results.filter(r => r.in_aio).length
  const cited = results.filter(r => r.site_cited).length
  const ranked = results.filter(r => r.our_pages && r.our_pages.length > 0).length
  const data = { checkedAt, summary: { total: results.length, in_aio: inAio, site_cited: cited, ranked }, keywords: results }
  await store.set(RESULTS_KEY, JSON.stringify(data))
  let history = []
  try { const raw = await store.get(HISTORY_KEY); if (raw) history = JSON.parse(raw) } catch {}
  history.unshift({ date: checkedAt.slice(0, 10), in_aio: inAio, site_cited: cited, total: results.length })
  if (history.length > 30) history = history.slice(0, 30)
  await store.set(HISTORY_KEY, JSON.stringify(history))
  return data
}

async function checkKeyword(keyword, apiKey) {
  const result = { keyword, in_aio: false, site_cited: false, aio_text: null, aio_sources: [], our_pages: [], organic_rank: null, error: null, checkedAt: new Date().toISOString() }
  try {
    const params = new URLSearchParams({ api_key: apiKey, q: keyword, location: 'Las Vegas, Nevada, United States', gl: 'us', hl: 'en', google_domain: 'google.com', num: '10' })
    const res = await fetch(`https://api.valueserp.com/search?${params}`, { signal: AbortSignal.timeout(25000) })
    if (!res.ok) { let e = `HTTP ${res.status}`; try { const t = await res.text(); if (t) e += ': ' + t.slice(0,200) } catch {} result.error = e; return result }
    let data
    try { const text = await res.text(); if (!text?.trim()) { result.error = 'Empty response'; return result }; data = JSON.parse(text) } catch (e) { result.error = 'Parse error: ' + e.message; return result }
    const aio = data.ai_overview
    if (aio) {
      result.in_aio = true
      const textParts = []
      if (aio.text_blocks) { for (const b of aio.text_blocks) { if (b.snippet) textParts.push(b.snippet); if (b.list) for (const i of b.list) if (i.snippet) textParts.push('• ' + i.snippet) } }
      if (!textParts.length && aio.snippet) textParts.push(aio.snippet)
      result.aio_text = textParts.join('\n\n').slice(0, 3000) || null
      const sources = [...(aio.ai_overview_sources||[]), ...(aio.sources||[]), ...(aio.references||[])]
      result.aio_sources = sources.map(s => ({ title: s.title||s.name||'', link: s.link||s.url||'' })).filter(s => s.link).slice(0, 10)
      result.site_cited = result.aio_sources.some(s => s.link.includes(SITE)) || JSON.stringify(aio).toLowerCase().includes(SITE)
      if (result.site_cited) {
        const ourAio = result.aio_sources.filter(s => s.link.includes(SITE))
        ourAio.forEach(p => result.our_pages.push({ where: 'AIO source', link: p.link, title: p.title }))
        if (!ourAio.length) result.our_pages.push({ where: 'AIO text mention', link: '', title: '' })
      }
    }
    ;(data.organic_results||[]).forEach((r, idx) => {
      if (r.link?.includes(SITE)) {
        const pos = r.position || (idx + 1)
        if (!result.organic_rank || pos < result.organic_rank) result.organic_rank = pos
        result.our_pages.push({ where: `Organic #${pos}`, link: r.link, title: r.title||'' })
      }
    })
    if (!result.our_pages.length && JSON.stringify(data).toLowerCase().includes(SITE)) {
      result.our_pages.push({ where: 'Appears in response', link: '', title: 'Found in SERP data' })
    }
  } catch (err) { result.error = err.message }
  return result
}
