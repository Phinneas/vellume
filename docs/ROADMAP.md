# Vellume Roadmap

## V1 — Web App (Current)

**Goal:** Core journal-to-image web experience.

**Deployment:** Frontend on Netlify, backend (API + D1 + R2 + KV) on Cloudflare Workers.

- [x] Auth system (login, signup, protected routes)
- [x] Write page (text entry + cloud AI image generation)
- [x] Gallery page (visual diary of past entries)
- [x] Entry detail page (full entry + image, delete, share)
- [x] Freemium model ($4.99/month, 3 free images/week)
- [ ] 3 image styles: Pixel Art (Arcade), Painterly (Dreamscape), Watercolor (Golden Hour)
- [ ] Onboarding style selection screen
- [ ] Style preference in settings (changeable anytime)
- [ ] Simplified write page (single Generate button using default style)
- [ ] Token consistency fix (gallery + entry pages)
- [ ] Test infrastructure (Jest + React Testing Library)

---

## V2 — Mobile App + Enhanced Web

**Goal:** Bare React Native mobile app + contextual memory features on web.

### Mobile (Bare React Native CLI — no Expo)
- [ ] Bare React Native app (iOS-first)
- [ ] Monorepo setup (Turborepo) with shared `packages/core` (API clients, Zustand stores, TypeScript types)
- [ ] Feature parity with V1 web app
- [ ] Voice input — speak a journal entry instead of typing
- [ ] Mobile-native camera integration for entry context

### Web Enhancements
- [ ] Per-entry style override (change style for a single entry without changing default)
- [ ] Artist sub-styles within each category (e.g. Sargent vs. Klee within Watercolor)
- [ ] Style preview images shown during selection (AI-generated examples per style)
- [ ] Journal context / memory — surface related past entries when writing about similar topics
  - Lightweight semantic retrieval (candidate: OpenViking or similar)
  - User-controlled, opt-in — "You've written about this before. See it?"
  - NOT automatic injection (avoid the Mistral/Kimi aggressive memory problem)
- [ ] Progress tracking on recurring themes — users can tag an issue and track it over time

### Infrastructure
- [ ] Evaluate full backend migration to Netlify (Netlify Edge Functions + Netlify DB on Neon PostgreSQL)
  - If migrating: D1 → Neon PostgreSQL, R2 → Netlify Blobs, KV → Upstash Redis
  - Drizzle ORM already supports PostgreSQL — schema migration needed

---

## V3 — Desktop + Scale

**Goal:** Desktop app and platform maturity.

- [ ] Desktop app (Electron or Tauri wrapping the web app)
- [ ] Advanced journal analytics (mood patterns, recurring themes over time, visual timeline)
- [ ] Style library expansion — artist-specific styles released as content drops
- [ ] Social / sharing features — optional public gallery, shareable visual diary pages
- [ ] Full backend migration to Netlify (if not completed in V2)

---

## Style System Notes

### Launch Styles (V1)
| ID | User-facing Name | Artist Inspiration | Feel |
|----|------------------|--------------------|------|
| `pixel_art` | Arcade | Classic 16-bit RPG era | Retro & playful |
| `painterly` | Dreamscape | Makoto Shinkai | Warm & cinematic |
| `watercolor` | Golden Hour | John Singer Sargent | Soft & evocative |

### Future Styles (V2+)
- **Watercolor variants:** Matisse (bold/joyful), Turner (atmospheric), Paul Klee (dreamlike/playful)
- **Painterly variants:** Kazuo Oga/Ghibli backgrounds (environmental), Ilya Kuvshinov (portrait-focused)
- **Additional styles TBD:** Comic panel, ink sketch, vintage photo/polaroid

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | Next.js 15 | React ecosystem alignment with future React Native mobile app |
| Frontend hosting | Netlify | Native Next.js adapter, better than OpenNext/Cloudflare for frontend |
| Backend hosting | Cloudflare Workers | Already deployed, D1/R2/KV integrated, generous free tier |
| Database | Cloudflare D1 (SQLite) | V1. Evaluate Neon PostgreSQL for V2/V3 |
| Image storage | Cloudflare R2 | Integrated with Workers, no egress fees |
| Mobile framework | Bare React Native CLI | No Expo — too many downstream issues |
| State management | Zustand | Works identically in React and React Native |
| Monorepo tool | Turborepo (V2) | Shared packages between web and mobile |
