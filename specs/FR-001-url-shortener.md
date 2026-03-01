# FR-001: URL Shortener Core Feature

**Created:** 2026-03-01 GMT  
**Status:** Awaiting Sign-off  
**Priority:** P0 (POC)  

---

## Goal

Build a minimal viable URL shortener that:
1. Accepts a long URL and generates a short code
2. Redirects short links to the original URL
3. Tracks click counts
4. Displays simple stats

---

## Database Schema

### Table: `urls`

```sql
CREATE TABLE urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_url TEXT NOT NULL,
  short_code VARCHAR(8) UNIQUE NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_urls_short_code ON urls(short_code);
```

**Supabase Setup:**
1. Create new Supabase project or use existing
2. Run SQL above in SQL Editor
3. Enable Row Level Security (RLS):
   ```sql
   ALTER TABLE urls ENABLE ROW LEVEL SECURITY;
   
   -- Allow all operations for now (public POC)
   CREATE POLICY "Enable all for urls" ON urls
     FOR ALL USING (true);
   ```
4. Get project URL and anon key
5. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## User Stories

### US-1: Shorten URL
**As a** user  
**I want to** paste a long URL and get a short link  
**So that** I can share it easily

**Acceptance Criteria:**
- ✅ Input field accepts any valid URL
- ✅ Click "Shorten" → generates short code (e.g., `abc123de`)
- ✅ Display short link: `linksnip.vercel.app/abc123de`
- ✅ Copy button copies short link to clipboard
- ✅ Show error if URL is invalid
- ✅ Short code is 8 characters (alphanumeric, case-sensitive)

### US-2: Redirect
**As a** visitor  
**I want to** visit a short link and be redirected  
**So that** I reach the original URL quickly

**Acceptance Criteria:**
- ✅ `GET /[shortCode]` redirects to original URL (HTTP 307)
- ✅ Increment click counter on each visit
- ✅ Show 404 if short code doesn't exist
- ✅ Redirect happens in <500ms

### US-3: View Stats
**As a** user  
**I want to** see how many clicks my link got  
**So that** I can track engagement

**Acceptance Criteria:**
- ✅ After shortening, display click count (starts at 0)
- ✅ Real-time update (or refresh to see latest count)
- ✅ Display: "Your link: [short link] | Clicks: [count]"

---

## UI Mockup

### Home Page (`/`)

```
┌─────────────────────────────────────────────────────┐
│                    LinkSnip                         │
│            Fast, simple URL shortening              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Paste your long URL:                              │
│  ┌───────────────────────────────────────────────┐ │
│  │ https://example.com/very/long/url/...       │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│          [ Shorten URL ]                           │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ✅ Short link created:                            │
│  ┌───────────────────────────────────────────────┐ │
│  │ linksnip.vercel.app/abc123de     [ Copy ]   │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Clicks: 0                                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Design Notes:**
- Clean, minimal interface
- Center-aligned layout
- Tailwind for styling
- Primary button: Blue (`bg-blue-600 hover:bg-blue-700`)
- Input: Large, clear borders
- Success state: Green text for "✅ Short link created"

---

## API Routes

### `POST /api/shorten`
**Request:**
```json
{
  "url": "https://example.com/long/url"
}
```

**Response (200):**
```json
{
  "shortCode": "abc123de",
  "shortUrl": "https://linksnip.vercel.app/abc123de",
  "originalUrl": "https://example.com/long/url",
  "clicks": 0
}
```

**Response (400):**
```json
{
  "error": "Invalid URL"
}
```

**Logic:**
1. Validate URL (must start with http:// or https://)
2. Generate random 8-char short code (alphanumeric)
3. Check if code exists in DB → regenerate if collision
4. Insert into `urls` table
5. Return short URL

### `GET /[shortCode]`
**Behavior:**
1. Look up short code in `urls` table
2. If found:
   - Increment `clicks` column (`UPDATE urls SET clicks = clicks + 1 WHERE short_code = ...`)
   - Redirect to `original_url` (HTTP 307 Temporary Redirect)
3. If not found:
   - Return 404 Not Found page

---

## Technical Implementation

### Short Code Generation
```typescript
function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

### URL Validation
```typescript
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
```

### Supabase Client Setup
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

## File Structure

```
app/
├── api/
│   └── shorten/
│       └── route.ts          # POST /api/shorten
├── [shortCode]/
│   └── page.tsx              # GET /[shortCode] redirect
├── layout.tsx
├── page.tsx                  # Home page with input form
└── globals.css

lib/
└── supabase.ts               # Supabase client
```

---

## Acceptance Tests (QA Checklist)

### Manual Tests
1. ✅ Visit home page → Input field and button visible
2. ✅ Enter valid URL → Click "Shorten" → Short link appears
3. ✅ Copy short link → Paste in browser → Redirects to original URL
4. ✅ Visit short link again → Click count increments
5. ✅ Enter invalid URL → Error message displays
6. ✅ Visit non-existent short code → 404 page

### Automated Tests (Playwright)
```typescript
test('can shorten URL and redirect', async ({ page }) => {
  // Visit home
  await page.goto('/');
  
  // Enter URL
  await page.fill('input[name="url"]', 'https://example.com');
  await page.click('button:has-text("Shorten")');
  
  // Wait for short link
  const shortLink = await page.locator('[data-testid="short-link"]').textContent();
  expect(shortLink).toMatch(/linksnip.*\/[A-Za-z0-9]{8}/);
  
  // Visit short link
  await page.goto(shortLink!);
  
  // Should redirect
  await page.waitForURL('https://example.com');
});
```

---

## Non-Goals (Out of Scope for POC)

- ❌ User authentication
- ❌ Custom short codes
- ❌ Link expiration
- ❌ Analytics dashboard
- ❌ QR code generation
- ❌ Link editing/deletion
- ❌ Password-protected links

---

## Sign-off Required

**Backend Agent:** Build API routes + Supabase integration  
**Frontend Agent:** Build UI + form handling  

**Matty:** Review spec and approve before build

---

**Questions for Matty:**

1. ✅ Is 8 characters enough for short codes? (supports 218 trillion unique codes)
2. ✅ Should we use existing Supabase project or create new one?
3. ✅ Any preference for URL validation strictness? (currently requires http/https)
4. ✅ OK to have public read/write access (no auth) for POC?

---

**Sign-off:** _______________________ (Matty)
