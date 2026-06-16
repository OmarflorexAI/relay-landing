# Relay — Agents for developers

A premium, dark-themed marketing landing page for **Relay**, a (demo) platform for building, deploying, and observing autonomous AI agents.

> Demo brand. Copy, logos, and testimonials are illustrative placeholders.

## Stack

**No build step.** Static site, vanilla HTML/CSS/JS, Tailwind via CDN (runtime JIT). Edit the files and refresh — that's the whole workflow.

```
.
├── index.html          # The full page (inline Tailwind config + section markup)
├── assets/
│   ├── site.css        # Design tokens + all custom styles
│   ├── app.js          # Interactions: nav, reveals, tabs, charts, modal, spotlight
│   └── logos/          # Full-colour brand SVGs used in the logo marquee
├── screenshot.js       # Puppeteer dual-viewport screenshot tool (dev only)
└── package.json        # Dev dependency: puppeteer (screenshots only)
```

## Highlights

- Interactive 3D hero object (Spline) with perpetual motion
- Animated, per-section white background grid with smooth edge fades
- Colour brand-logo marquee (continuous, never pauses)
- Interactive SVG charts (hover crosshair + wipe-in reveal)
- Tabbed code/dashboard panels, animated counters
- Cursor-spotlight testimonial cards
- 3-tier pricing with blur-in reveal
- Get-started modal, fully responsive, keyboard-accessible

## Local preview

Any static server works, e.g.:

```bash
python -m http.server 5500
# open http://localhost:5500/
```

## Screenshots (optional, dev)

```bash
npm install        # puppeteer
npm run screenshot # -> screenshot-{desktop,mobile}.png
```

## Deploy

Hosted on **GitHub Pages** (deploy from the `main` branch, root). No build required.
