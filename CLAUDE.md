# CLAUDE.md

Guidance for Claude Code when working in this repo.

## What This Is

AI SAAS marketing site (AI consulting agency) — two static pages (`/` and `/contact`) hosted on **GitHub Pages**, with Cloudflare as a DNS/proxy CDN in front. Form submissions go to Web3Forms (third-party).

**This is a no-build-step static site.** Edit HTML/CSS/JS → push → deploys via GitHub Pages auto-build.

## Architecture

```
.
├── index.html             # ~2960 lines — full inline <style> + <script> + Tailwind CDN
├── contact/index.html     # ~711 lines — same pattern, lead-capture form
├── assets/
│   └── site.css           # The only external CSS. Shared brand tokens (:root)
│                          # + footer styles. Loaded by both pages.
├── brand_assets/          # SVG logos for tools (Stripe, Shopify, etc.) + main ROMANALABS logo
├── package.json           # devDependencies: puppeteer (screenshot script only)
├── screenshot.js          # Puppeteer dual-viewport screenshot tool
├── CNAME                  # GitHub Pages custom-domain marker — romanalabs.com
├── progress.md            # Living session checkpoint — read this on every resume
└── .gitignore             # Excludes node_modules, screenshots, .env*, *.exe
```

**Tailwind via CDN runtime JIT.** Loaded at `<script src="https://cdn.tailwindcss.com">`. The CDN prints a console warning about production use; this is accepted. Pre-building Tailwind locally was attempted (commit `ea9e2ac`) and reverted (`bc23e51`) because the static build was missing utilities the JIT generated from the live DOM.

## Commands

```bash
npm run screenshot    # Puppeteer dual-viewport screenshot → screenshot-{mobile,desktop}.png
```

No build step. Editing HTML/CSS/JS is enough — push and it deploys.

## Cache invalidation

GitHub Pages serves with `max-age=600` defaults. Browsers cache CSS/JS aggressively. The repo uses **`?v=N` cache-bust query strings** appended to asset URLs in HTML (currently `?v=4`).

When you change any inline CSS or JS or `assets/site.css`, **bump `?v=N` to `?v=N+1`** in every `<link href="...?v=N">` and `<script src="...?v=N">` reference in `index.html` and `contact/index.html`. Otherwise returning users keep seeing the old version for up to 10 minutes.

## Brand tokens (source of truth: `assets/site.css` `:root` block)

| Token | Value | Use |
| --- | --- | --- |
| `--accent` | `#D4AF37` | Muted gold — CTAs, key metrics, italic emphasis |
| `--accent-hover` | `#C49B2E` | Hover state for gold elements |
| `--emerald` | `#1B4332` | British Racing Green — labels, borders, secondary actions |
| `--bg-primary` | `#F9F9F7` | Soft alabaster — page background |
| `--bg-card` | `#0A0D0B` | Deep obsidian — footer, dark cards |
| Heading font | Space Grotesk | Geometric sans, all headings + UI labels |
| Body font | Inter | Refined sans, all body text |

The Tailwind CDN's runtime config (inline `tailwind.config = {...}` in `index.html`) also defines `bg-accent`, `text-emerald`, etc. as Tailwind utilities. Keep these aligned if you change the palette.

## Push / deploy gotchas

- `git push` over HTTPS can stall silently on this Windows machine (HTTP/2 multiplexing bug). Always use: `git -c http.version=HTTP/1.1 push origin main`
- GitHub's secret-scanning push protection blocks pushes containing GitHub PAT strings. If you need to reference one in a commit message or markdown file, redact to first 11 + last 4 chars (e.g. `ghp_FUb5Ya…oTkQ`).
- `_headers` and `netlify.toml` files are NOT used. GitHub Pages doesn't read them. Don't add headers there expecting them to work.

## Rules

Detailed rules live in `.claude/rules/`:

| File | Status |
|---|---|
| `screenshot-workflow.md` | Active — generate→screenshot→compare→fix loop |
| `design-fidelity.md` | Active — match references exactly, don't add features |
| `puppeteer-screenshots.md` | Active — explains `revealAll()` and viewport sizes |
| `brand-identity.md` | Active (palette section refreshed — see Brand tokens above) |
| `technical-defaults.md` | Active — Tailwind via CDN, single file, mobile-first |

## Behavioral rules (HARD CONSTRAINTS from user)

- **Do only what the user asks, in the scope they ask.** No proactive architecture overhauls or "senior-engineer correct" sweeping refactors. The user has pushed back on unauthorized big changes.
- **Check with the user before any change that touches more than the specific element/file they mentioned.**
- **Do not externalize inline CSS or JS** without testing in production first. Pre-built Tailwind missed runtime-JIT'd utilities and broke the site silently.
- **No fabricated social proof or compliance claims.** Don't invent testimonials, named clients, or compliance badges. Always flag and ask.
- **Cal.com link is always secondary, never a competing primary button.**

**Gotcha (still relevant):** project directory path contains a space. `screenshot.js` uses URL-encoded `file:///` paths (`%20`) for Puppeteer navigation but literal paths for file output.
