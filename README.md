# Expenzo 💸

Lightning-fast expense tracker. Log in 2 seconds, see clearly.

## Stack
- **Next.js 15** (App Router) — frontend + API routes
- **Supabase** — database + auth + real-time
- **Tailwind CSS** — styling
- **Vercel** — hosting

---

## Setup (15 minutes)

### 1. Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Go to **SQL Editor** → New query
3. Paste the contents of `supabase-schema.sql` and run it
4. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon public` key

### 2. Enable Google Auth in Supabase

1. Supabase Dashboard → **Authentication → Providers → Google**
2. Enable it
3. Go to [Google Cloud Console](https://console.cloud.google.com)
4. Create a project → APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Paste Client ID + Secret back into Supabase

### 3. Local development

```bash
# Clone / download the project
cd expenzo

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

In Supabase → Authentication → URL Configuration, add:
- Site URL: `https://your-app.vercel.app`
- Redirect URL: `https://your-app.vercel.app/auth/callback`

---

## How to use

**Logging:** Type `50 rent` or `120 fabric` → hit Enter. Done.

**Smart categories detected automatically:**
| You type | Category | Subcategory |
|----------|----------|-------------|
| `50 rent` | Personal | Rent |
| `120 fabric` | Business | Materials |
| `30 food` | Personal | Food |
| `200 ads` | Business | Ads |
| `15 uber` | Personal | Transport |
| `500 salary` | Business | Salaries |

Unknown keywords → saved as custom uncategorised entry.

---

## File structure

```
src/
├── app/
│   ├── page.tsx              # Add Entry screen (main)
│   ├── overview/page.tsx     # Overview + charts
│   ├── login/page.tsx        # Google sign in
│   ├── auth/callback/        # OAuth callback
│   └── api/entries/          # API routes
├── components/
│   ├── TabBar.tsx
│   ├── Toast.tsx
│   ├── EntryCard.tsx
│   └── ParseChips.tsx
├── lib/
│   ├── parser.ts             # Smart text parser
│   └── supabase/             # Client + server
└── types/index.ts
```
