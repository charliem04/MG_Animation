# mattjyguidry.tv

Matt Guidry's portfolio site (video and animation): a one-page showreel
site with a project brief form, plus Terms of Service and Privacy Policy
pages.

- **Stack:** Next.js 14, exported as static files (`site/out/`).
- **Hosting:** Cloudflare Workers static assets, Worker `mg-animation`.
  Every push to `main` rebuilds and deploys (about 1–2 minutes).
- **Content editing:** [Pages CMS](https://app.pagescms.org), configured
  in [`.pages.yml`](.pages.yml). Saving there commits to `main`.
- **Form:** posts straight from the browser to Web3Forms, which emails
  Matt. See [docs/WEB3FORMS-SETUP.md](docs/WEB3FORMS-SETUP.md).

## Who edits what

| What | Where | Who |
| --- | --- | --- |
| Hero name, intro, button words | Pages CMS → Hero (`site/content/hero.json`) | Matt |
| Showreel, scrolling words, video cards | Pages CMS → Work (`site/content/work.json`) | Matt |
| About section and headshot | Pages CMS → About (`site/content/about.json`) | Matt |
| Terms of Service | Pages CMS → Terms of service (`site/content/terms.json`) | Matt |
| Privacy Policy | `site/app/privacy/page.tsx` | Developer only |
| Phone, email, form choices, contact copy, SEO title | `site/client.config.ts` | Developer |

The Privacy Policy stays in code on purpose: it describes what the
site's code collects and where it sends it, so it has to change
whenever the code does.

Each CMS file has a checker next to it (`hero.ts`, `work.ts`,
`about.ts`, `terms.ts`). If a save leaves something the page can't
show, the build stops with a plain-English message and the last good
version stays live.

## Waiting on Matt

Both of these are switched off until Matt sends what's needed.

**Logo.** The nav shows his name as a text wordmark.
1. Put the file in `site/public/brand/` (SVG preferred, e.g. `logo.svg`).
2. Set `logoPath: "/brand/logo.svg"` in `site/client.config.ts`.
3. The nav draws it at 28px tall (`.sg-nav-logo` in `site/app/globals.css`).

**Social accounts.** No social links show on the page. The URLs in
`client.socials` (only Vimeo today) feed the structured data search
engines read, and nothing else.
1. Add each profile URL to `client.socials` in `site/client.config.ts`.
2. Add its origin (e.g. `https://www.instagram.com`) to `linkOnly` in
   `site/scripts/csp.mjs`, or the build stops and asks.
3. Visible links or icons on the page are a small new piece of UI to
   build at that point; the footer (`SiteFooter` in
   `site/components/signal/SiteChrome.tsx`) is the natural place.

## Working on it

```bash
cd site
npm install
npm run dev        # http://localhost:3000
npm run build      # the full pipeline, as Cloudflare runs it
```

Copy `site/.env.example` to `site/.env.local` for local work. In
production those values are set on the `mg-animation` Worker.

`npm run build` is more than `next build`. After the export it:

- `csp.mjs` writes the Content-Security-Policy into `out/_headers`, and
  fails if the page references a third-party origin the policy doesn't
  cover.
- `fonts.mjs` preloads the hero font.
- `seo.mjs` fails on titles over 60 characters or descriptions over 160.
- `routes.mjs` checks every internal link resolves.
- `harden.mjs` checks no secret or source map ended up in the output.

`npm run check` is an advisory style checker; its "round-stat" notes
are false positives here.

## Layout

```
site/
  app/            pages: home, terms, privacy, 404, robots, sitemap
  components/
    signal/       the site's sections (hero, work, about, contact, nav)
    *.tsx         page wipe, smooth scroll, analytics, cookie banner, structured data
  content/        CMS files (*.json) and their build-time checkers (*.ts)
  lib/            form sending and cleaning, routes, consent, tracking
  public/         images, the reel loop, _headers, _redirects
  scripts/        the build checks listed above
```
