# criminallyprolific.com — Netlify Static Site

Plain HTML/CSS/JS site hosted on Netlify. No build step required.

## Structure

```
cp-site/
├── netlify.toml          # Netlify config, redirects, headers
├── _layout.html          # Shared nav + footer template (reference only)
├── public/               # Everything in here gets deployed
│   ├── index.html        # Homepage
│   ├── robots.txt
│   ├── llms.txt          # AI indexing file
│   ├── sitemap.xml       # (generate or copy from WP)
│   ├── assets/
│   │   ├── css/main.css  # All styles
│   │   ├── js/main.js    # Modal, nav, toggle logic
│   │   └── img/          # Local images (favicon etc)
│   ├── interviews/
│   │   └── index.html
│   ├── about/
│   │   └── index.html
│   ├── book/
│   │   └── index.html
│   ├── kind-words/
│   │   └── index.html
│   ├── press/
│   │   └── index.html
│   ├── signup/
│   │   └── index.html
│   └── [blog-slug]/
│       └── index.html    # One folder per article
```

## Deploy to Netlify

1. Push this repo to GitHub
2. Go to netlify.com → New site from Git
3. Set publish directory to `public`
4. Deploy — done

Or drag-drop the `public/` folder to netlify.com/drop for instant preview.

## Adding blog posts

Each blog post lives at `/public/[slug]/index.html`.
Copy the article template from any existing post and update:
- `<title>`
- `<meta name="description">`
- `<link rel="canonical">`
- The JSON-LD schema block
- `article-cat`, `article-h1`, `article-meta`
- The `<div class="prose">` body content

## Design system

- Font: Inter (Google Fonts)
- Primary: `#111` (near-black)
- Accent: `#0033ff` (blue) — used for CTAs, eyebrows, links only
- Footer bg: `#0f1829` (deep navy)
- All styles in `/assets/css/main.css`
