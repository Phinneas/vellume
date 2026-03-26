# Vellume V1 Style System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the pixel-art-only style system with a 3-style image generation system (Pixel Art, Painterly, Watercolor), add onboarding style selection, and persist the user's default style preference across the app.

**Architecture:** Style preference is stored in the Zustand persist store and sent with every image generation request to the existing `/api/images/generate-cloud` endpoint. A new onboarding screen captures style preference after signup. The write page is simplified to use the user's stored default, removing the confusing dual-button pattern. No backend changes are required — the API already accepts a `style` parameter.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, Zustand 5, Jest + React Testing Library (to be installed)

**Deployment:** Frontend on **Netlify** (native Next.js adapter — replaces OpenNext/Cloudflare Workers for the frontend). Backend API, D1, R2, and KV remain on **Cloudflare Workers**. Remove `opennextjs-cloudflare` dependency and `wrangler.jsonc` frontend config after migration.

---

## Important: Current Codebase Notes

Before touching anything, read these files to understand patterns:
- `src/lib/store.ts` — Zustand store; all client state lives here
- `src/app/write/page.tsx` — The write page; currently has dual "Pattern Art" / "AI Image" buttons and 4 pixel-art-only style presets
- `src/app/signup/page.tsx` — Signup flow; currently redirects to `/write` after success
- `src/app/gallery/page.tsx` — **BUG:** uses `localStorage.getItem("betterAuthToken")` instead of store token
- `src/app/entry/[id]/page.tsx` — **BUG:** same localStorage token bug

**API Contract (do not change the backend):**
- Endpoint: `POST /api/images/generate-cloud`
- Body: `{ entry_text: string, journal_id: string, style: string }`
- Valid style values for V1: `"pixel_art"` | `"painterly"` | `"watercolor"`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/styles.ts` | Style constants, types, and helper functions. Single source of truth for all 3 styles. |
| `src/components/style-card.tsx` | Reusable UI card for displaying and selecting a style. Used in onboarding and settings. |
| `src/app/onboarding/style/page.tsx` | First-run style selection screen shown after signup. |
| `jest.config.js` | Jest configuration for Next.js + TypeScript. |
| `jest.setup.js` | Jest setup file (imports `@testing-library/jest-dom`). |
| `src/lib/__tests__/styles.test.ts` | Tests for style utilities. |
| `src/components/__tests__/style-card.test.tsx` | Tests for the StyleCard component. |

### Modified Files
| File | What Changes |
|------|-------------|
| `src/lib/store.ts` | Add `imageStyle` field (default `"pixel_art"`), add `setImageStyle` action. |
| `src/app/signup/page.tsx` | After successful signup, redirect to `/onboarding/style` instead of `/write`. |
| `src/app/settings/page.tsx` | Add "Image Style" section with StyleCard selector. |
| `src/app/write/page.tsx` | Remove 4 pixel-art presets and "Pattern Art" button. Single "Generate Image" button uses store's `imageStyle`. Remove `showStylePicker` state. |
| `src/app/gallery/page.tsx` | Fix token bug: use `useAuthStore` hook instead of direct `localStorage`. |
| `src/app/entry/[id]/page.tsx` | Fix token bug: use `useAuthStore` hook instead of direct `localStorage`. |
| `package.json` | Add jest, @testing-library/react, @testing-library/jest-dom, jest-environment-jsdom, ts-jest |

---

## Chunk 1: Test Infrastructure + Style Foundation

### Task 1: Install Test Dependencies

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`
- Create: `jest.setup.js`

- [ ] **Step 1: Install test dependencies**

```bash
cd /path/to/vellume
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom ts-jest @types/jest
```

Expected: packages install without errors.

- [ ] **Step 2: Create jest.config.js**

```js
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterFramework: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

- [ ] **Step 3: Create jest.setup.js**

```js
// jest.setup.js
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test script to package.json**

In the `"scripts"` section, add:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 5: Verify jest runs (even with no tests)**

```bash
npm test -- --passWithNoTests
```

Expected: exits 0 with "No tests found" or similar.

- [ ] **Step 6: Commit**

```bash
git add jest.config.js jest.setup.js package.json package-lock.json
git commit -m "chore: add jest + react testing library"
```

---

### Task 2: Style Constants and Types

**Files:**
- Create: `src/lib/styles.ts`
- Create: `src/lib/__tests__/styles.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `src/lib/__tests__/styles.test.ts`:

```typescript
import { STYLES, getStyleById, DEFAULT_STYLE, type ImageStyle } from '../styles'

describe('STYLES', () => {
  it('contains exactly 3 styles', () => {
    expect(STYLES).toHaveLength(3)
  })

  it('includes pixel_art, painterly, and watercolor', () => {
    const ids = STYLES.map(s => s.id)
    expect(ids).toContain('pixel_art')
    expect(ids).toContain('painterly')
    expect(ids).toContain('watercolor')
  })

  it('each style has id, name, description, and artistInspiration', () => {
    STYLES.forEach(style => {
      expect(style.id).toBeTruthy()
      expect(style.name).toBeTruthy()
      expect(style.description).toBeTruthy()
      expect(style.artistInspiration).toBeTruthy()
    })
  })
})

describe('getStyleById', () => {
  it('returns the correct style for a valid id', () => {
    const style = getStyleById('painterly')
    expect(style?.id).toBe('painterly')
  })

  it('returns undefined for an unknown id', () => {
    expect(getStyleById('unknown')).toBeUndefined()
  })
})

describe('DEFAULT_STYLE', () => {
  it('is pixel_art', () => {
    expect(DEFAULT_STYLE).toBe('pixel_art')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test src/lib/__tests__/styles.test.ts
```

Expected: FAIL — "Cannot find module '../styles'"

- [ ] **Step 3: Create src/lib/styles.ts**

```typescript
export type StyleId = 'pixel_art' | 'painterly' | 'watercolor'

export interface ImageStyle {
  id: StyleId
  name: string
  description: string
  artistInspiration: string
  /** Evocative subtitle shown to users */
  tagline: string
}

export const DEFAULT_STYLE: StyleId = 'pixel_art'

export const STYLES: ImageStyle[] = [
  {
    id: 'pixel_art',
    name: 'Arcade',
    description: 'Nostalgic pixel art, blocky and bold',
    artistInspiration: 'Classic 16-bit RPG era',
    tagline: 'Retro & playful',
  },
  {
    id: 'painterly',
    name: 'Dreamscape',
    description: 'Luminous, painterly scenes with emotional atmosphere',
    artistInspiration: 'Makoto Shinkai',
    tagline: 'Warm & cinematic',
  },
  {
    id: 'watercolor',
    name: 'Golden Hour',
    description: 'Loose, expressive watercolor with beautiful light',
    artistInspiration: 'John Singer Sargent',
    tagline: 'Soft & evocative',
  },
]

export function getStyleById(id: string): ImageStyle | undefined {
  return STYLES.find(s => s.id === id)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test src/lib/__tests__/styles.test.ts
```

Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/styles.ts src/lib/__tests__/styles.test.ts
git commit -m "feat: add image style constants and types"
```

---

### Task 3: Add imageStyle to Zustand Store

**Files:**
- Modify: `src/lib/store.ts`
- Modify: `src/lib/__tests__/styles.test.ts` (add store-related test, or create separate store test)

> **Read first:** `src/lib/store.ts` to understand existing shape before editing.

- [ ] **Step 1: Write failing test for store imageStyle**

Create `src/lib/__tests__/store.test.ts`:

```typescript
import { act, renderHook } from '@testing-library/react'
import { useAuthStore } from '../store'
import { DEFAULT_STYLE } from '../styles'

// Reset store between tests
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    subscription: null,
    usage: null,
    isAuthenticated: false,
    isLoading: false,
    imageStyle: DEFAULT_STYLE,
  })
})

describe('imageStyle', () => {
  it('defaults to pixel_art', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.imageStyle).toBe('pixel_art')
  })

  it('setImageStyle updates the style', () => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.setImageStyle('painterly')
    })
    expect(result.current.imageStyle).toBe('painterly')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test src/lib/__tests__/store.test.ts
```

Expected: FAIL — "result.current.imageStyle is undefined"

- [ ] **Step 3: Update src/lib/store.ts**

Add `imageStyle` field and `setImageStyle` action. The diff is:

```typescript
// Add to imports at top:
import { type StyleId, DEFAULT_STYLE } from './styles'

// Add to AuthState interface:
imageStyle: StyleId
setImageStyle: (style: StyleId) => void

// Add to initial state in create():
imageStyle: DEFAULT_STYLE,

// Add action:
setImageStyle: (style: StyleId) =>
  set({ imageStyle: style }),
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test src/lib/__tests__/store.test.ts
```

Expected: PASS — 2 tests passing.

- [ ] **Step 5: Run all tests to confirm nothing is broken**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/store.ts src/lib/__tests__/store.test.ts
git commit -m "feat: add imageStyle preference to auth store"
```

---

## Chunk 2: Style Card Component + Onboarding

### Task 4: StyleCard Component

**Files:**
- Create: `src/components/style-card.tsx`
- Create: `src/components/__tests__/style-card.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/style-card.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { StyleCard } from '../style-card'
import { STYLES } from '@/lib/styles'

const mockStyle = STYLES[0] // pixel_art / Arcade

describe('StyleCard', () => {
  it('renders the style name', () => {
    render(<StyleCard style={mockStyle} selected={false} onSelect={() => {}} />)
    expect(screen.getByText('Arcade')).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<StyleCard style={mockStyle} selected={false} onSelect={() => {}} />)
    expect(screen.getByText('Retro & playful')).toBeInTheDocument()
  })

  it('calls onSelect with style id when clicked', () => {
    const onSelect = jest.fn()
    render(<StyleCard style={mockStyle} selected={false} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('pixel_art')
  })

  it('shows selected state when selected=true', () => {
    render(<StyleCard style={mockStyle} selected={true} onSelect={() => {}} />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('ring-2')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test src/components/__tests__/style-card.test.tsx
```

Expected: FAIL — "Cannot find module '../style-card'"

- [ ] **Step 3: Create src/components/style-card.tsx**

```typescript
'use client'

import { type ImageStyle, type StyleId } from '@/lib/styles'

interface StyleCardProps {
  style: ImageStyle
  selected: boolean
  onSelect: (id: StyleId) => void
}

export function StyleCard({ style, selected, onSelect }: StyleCardProps) {
  return (
    <button
      onClick={() => onSelect(style.id)}
      className={`
        w-full text-left border-2 border-[#2C3E50] p-6 bg-white
        transition-all hover:bg-[#F4EBD9]
        ${selected ? 'ring-2 ring-[#2C3E50] ring-offset-2 bg-[#F4EBD9]' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-bold font-mono text-[#2C3E50]">{style.name}</h3>
        {selected && (
          <span className="text-xs font-mono font-bold text-[#2C3E50] bg-[#2C3E50]/10 px-2 py-1 rounded">
            Selected
          </span>
        )}
      </div>
      <p className="text-sm font-mono text-[#2C3E50]/60 mb-2">{style.tagline}</p>
      <p className="text-sm font-mono text-[#2C3E50]/80">{style.description}</p>
      <p className="text-xs font-mono text-[#2C3E50]/40 mt-3">
        Inspired by {style.artistInspiration}
      </p>
    </button>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test src/components/__tests__/style-card.test.tsx
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/style-card.tsx src/components/__tests__/style-card.test.tsx
git commit -m "feat: add StyleCard component"
```

---

### Task 5: Onboarding Style Selection Page

**Files:**
- Create: `src/app/onboarding/style/page.tsx`
- Modify: `src/app/signup/page.tsx` (change redirect target)

> **Read first:** `src/app/signup/page.tsx` to find where the post-signup redirect lives.

- [ ] **Step 1: Create src/app/onboarding/style/page.tsx**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STYLES, type StyleId } from '@/lib/styles'
import { StyleCard } from '@/components/style-card'
import { useAuthStore } from '@/lib/store'

export default function OnboardingStylePage() {
  const router = useRouter()
  const { setImageStyle, imageStyle } = useAuthStore()
  const [selected, setSelected] = useState<StyleId>(imageStyle)

  const handleContinue = () => {
    setImageStyle(selected)
    router.push('/write')
  }

  return (
    <div className="min-h-screen bg-[#F4EBD9] flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold font-mono text-[#2C3E50] mb-3">
            Choose your style
          </h1>
          <p className="text-[#2C3E50]/70 font-mono">
            How should your journal entries come to life? You can change this anytime in Settings.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-10">
          {STYLES.map(style => (
            <StyleCard
              key={style.id}
              style={style}
              selected={selected === style.id}
              onSelect={setSelected}
            />
          ))}
        </div>

        <button
          onClick={handleContinue}
          className="w-full py-4 bg-[#2C3E50] text-[#F4EBD9] font-bold font-mono text-lg hover:bg-[#1a252f] transition-colors"
        >
          Start writing →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update signup redirect**

In `src/app/signup/page.tsx`, find the line that redirects after successful signup. It will look like:

```typescript
router.push('/write')
// or
router.push('/gallery')
```

Change it to:

```typescript
router.push('/onboarding/style')
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Manual verification — start the dev server and test the signup flow**

```bash
npm run dev
```

Navigate to `http://localhost:3000/signup`, create an account, and confirm you land on `/onboarding/style` with 3 style cards shown. Select one and click "Start writing →" — confirm you land on `/write`.

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding/style/page.tsx src/app/signup/page.tsx
git commit -m "feat: add onboarding style selection screen"
```

---

## Chunk 3: Settings + Write Page

### Task 6: Style Preference in Settings

**Files:**
- Modify: `src/app/settings/page.tsx`

> **Read first:** `src/app/settings/page.tsx` to understand current structure.

- [ ] **Step 1: Update src/app/settings/page.tsx**

Import `STYLES`, `StyleCard`, and `useAuthStore`. Add a new section after "Account Information":

```typescript
// Add to imports:
import { STYLES, type StyleId } from '@/lib/styles'
import { StyleCard } from '@/components/style-card'

// Inside the component, add to destructure:
const { user, logout, imageStyle, setImageStyle } = useAuthStore()

// Add state for save feedback:
const [styleSaved, setStyleSaved] = useState(false)

// Add handler:
const handleStyleChange = (id: StyleId) => {
  setImageStyle(id)
  setStyleSaved(true)
  setTimeout(() => setStyleSaved(false), 2000)
}
```

Add this JSX block after the "Account Information" card and before the "About" card:

```tsx
<div className="border-2 border-[#2C3E50] p-6 bg-white mb-6">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl font-bold text-[#2C3E50]">Image Style</h2>
    {styleSaved && (
      <span className="text-sm font-mono text-green-600 font-bold">Saved ✓</span>
    )}
  </div>
  <div className="flex flex-col gap-3">
    {STYLES.map(style => (
      <StyleCard
        key={style.id}
        style={style}
        selected={imageStyle === style.id}
        onSelect={handleStyleChange}
      />
    ))}
  </div>
</div>
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Manual verification**

Navigate to `/settings`. Confirm the 3 style cards appear below account info. Click a different style — confirm "Saved ✓" feedback appears and clears after 2 seconds. Refresh the page — confirm the selection persists (stored in Zustand persist).

- [ ] **Step 4: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: add image style preference to settings"
```

---

### Task 7: Simplify Write Page

**Files:**
- Modify: `src/app/write/page.tsx`

> **Read first:** `src/app/write/page.tsx` carefully — there are multiple states and handlers to clean up.

**What to remove:**
- The `STYLE_PRESETS` array (the 4 pixel-art presets: Classic Pixel, Game Boy, NES, Commodore 64)
- The `selectedStyle` state
- The `showStylePicker` state
- The `handleGeneratePixelArt` function (local canvas-based generator)
- The `handleSaveWithImage` function (separate save flow for local art — cloud flow replaces it)
- The "Pattern Art" button
- The style picker dropdown and its toggle button
- The `isGenerating` state (only `isCloudGenerating` remains, rename it to `isGenerating`)
- The `pixelart.ts` import

**What to keep and update:**
- `handleGenerateCloudArt` — rename to `handleGenerate`. Update it to read style from store:

```typescript
const { token, subscription, usage, setSubscription, setUsage, imageStyle } = useAuthStore()

// In handleGenerate, replace the style field:
body: JSON.stringify({
  entry_text: entry,
  journal_id: journalId,
  style: imageStyle,   // ← was: selectedStyle
}),
```

**Simplified button bar** (replace the entire `<div className="flex flex-wrap justify-end gap-3">` block):

```tsx
<div className="flex flex-wrap justify-end gap-3 items-center">
  {/* Show current style as a subtle label */}
  <span className="text-xs font-mono text-[#2C3E50]/50 mr-auto">
    Style: {getStyleById(imageStyle)?.name ?? 'Arcade'} ·{' '}
    <button
      onClick={() => router.push('/settings')}
      className="underline hover:no-underline"
    >
      Change
    </button>
  </span>

  <button
    onClick={() => setEntry("")}
    className="px-6 py-2 border-2 border-[#2C3E50] text-[#2C3E50] font-bold font-mono hover:bg-[#F4EBD9] transition-colors"
  >
    Clear
  </button>

  <button
    onClick={handleGenerate}
    disabled={!entry.trim() || isGenerating}
    className="px-6 py-2 bg-[#2C3E50] text-[#F4EBD9] font-bold font-mono hover:bg-[#1a252f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
  >
    {isGenerating ? (
      <>
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Generating...
      </>
    ) : (
      <>
        <Sparkles className="w-4 h-4" />
        Generate
        {!isPremium && usage && (
          <span className="bg-amber-400 text-[#2C3E50] text-xs px-2 py-0.5 rounded-full font-bold">
            {usage.limit - usage.images_this_week} left
          </span>
        )}
      </>
    )}
  </button>

  {pixelArt && (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className="px-6 py-2 bg-[#27ae60] text-white font-bold font-mono hover:bg-[#219653] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSaving ? "Saving..." : "Save Entry"}
    </button>
  )}
</div>
```

> **Note:** After simplification, the "Save" button (without image) is only shown when no image has been generated yet. Once an image exists, "Save Entry" saves both. Update `handleSave` to also save the journal entry when `pixelArt` is present — or keep the two paths but only show one button at a time.

- [ ] **Step 1: Make the changes described above to src/app/write/page.tsx**

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Manual verification**

Start dev server. Navigate to `/write`. Confirm:
- Only one "Generate" button visible (no "Pattern Art")
- Style label in bottom bar shows current style with "Change" link
- Clicking "Change" goes to `/settings`
- Generating an image works and saves correctly to gallery

- [ ] **Step 4: Commit**

```bash
git add src/app/write/page.tsx
git commit -m "feat: simplify write page to use stored default image style"
```

---

## Chunk 4: Bug Fixes

### Task 8: Fix Token Usage in Gallery and Entry Pages

**Files:**
- Modify: `src/app/gallery/page.tsx`
- Modify: `src/app/entry/[id]/page.tsx`

Both pages currently bypass the Zustand store and read directly from localStorage:
```typescript
const token = localStorage.getItem("betterAuthToken")
```

This is inconsistent with the rest of the app (write page, settings) which use the store.

**Fix for both files:**

- [ ] **Step 1: Update gallery/page.tsx**

Add import and hook at the top of the component:
```typescript
import { useAuthStore } from '@/lib/store'
// ...
const { token } = useAuthStore()
```

Remove this line from inside `fetchJournals`:
```typescript
const token = localStorage.getItem("betterAuthToken")
```

- [ ] **Step 2: Update entry/[id]/page.tsx**

Same fix: import `useAuthStore`, destructure `token`, remove the two `localStorage.getItem("betterAuthToken")` calls (one in `fetchJournal`, one in `handleDelete`).

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Manual verification**

Navigate to `/gallery` — entries should load correctly. Click an entry — detail page should load. Delete an entry — should work correctly.

- [ ] **Step 5: Commit**

```bash
git add src/app/gallery/page.tsx src/app/entry/\[id\]/page.tsx
git commit -m "fix: use auth store token instead of direct localStorage access"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
npm test
```

Expected: all tests pass, no failures.

- [ ] **Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Run linter**

```bash
npm run lint
```

Expected: no lint errors.

- [ ] **End-to-end manual walkthrough**

1. Sign up as a new user → lands on `/onboarding/style`
2. Select "Dreamscape" → lands on `/write`
3. Write a journal entry → click "Generate" → image generates in Dreamscape/painterly style
4. "Save Entry" → redirects to `/gallery` → entry visible with image
5. Click entry → `/entry/[id]` shows full text and image
6. Go to `/settings` → "Image Style" section shows Dreamscape selected
7. Change to "Golden Hour" → "Saved ✓" appears
8. Go back to `/write` → bottom bar shows "Style: Golden Hour"

---

## Out of Scope (V2)

The following were discussed but deliberately excluded from V1:

- **Voice input** — microphone capture and speech-to-text transcription
- **Per-entry style override** — changing style for a single entry without changing the default
- **Artist sub-styles** — choosing Sargent vs. Klee within Watercolor, etc.
- **Style preview images** — showing an example AI image for each style during selection
- **Backend changes** — the API already accepts `style`; no backend work needed for V1
