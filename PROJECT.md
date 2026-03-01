# LinkSnip

URL shortener with click tracking

## Setup

Created: 2026-03-01 GMT
Repository: https://github.com/Brumalia/linksnip

## Tech Stack

- Next.js 16.1.6
- TypeScript
- Tailwind CSS
- Supabase

## Development

```bash
npm run dev
```

## Deployment

- **Production:** https://linksnip-zeta.vercel.app
- **Preview:** https://linksnip-deg647aok-matty575s-projects.vercel.app
- **GitHub:** https://github.com/Brumalia/linksnip

## Branches

- `main` → Vercel preview deployments
- `production` → Vercel production deployments

## Environment Variables

Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
linksnip/
├── app/              # Next.js app directory
├── public/           # Static assets
├── specs/            # Feature request specifications
└── PROJECT.md        # This file
```
