# Cozy Reads

A private, cloud-synced reading journal — track your annual book challenge, log finished reads, curate your favourite tropes, and download reading planners.

**[Live Demo →](https://cozy-reads.vercel.app)**

---

## Features

- **Reading Challenge Tracker** — set a yearly goal (12 / 24 / 36 / 48 / 75 / 100 books), log each finished book with optimistic UI and animated feedback
- **Trope Matrix** — toggle and auto-save favourite book tropes (romance + fantasy)
- **Secure Downloads** — 60-second signed URLs for PDF planners and sticker packs; raw storage paths never exposed
- **Private by default** — all data scoped to your account via Supabase Row Level Security

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Auth + DB | Supabase (PostgreSQL + GoTrue) |
| Storage | Supabase Storage |
| Hosting | Vercel |

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/fazal305/cozy-reads.git
cd cozy-reads
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Run the SQL in [`supabase/setup.sql`](supabase/setup.sql) in the Supabase SQL editor
3. Create a private Storage bucket named **`reading-assets`** and upload your PDF/ZIP files
4. Add a Storage RLS policy allowing SELECT for `auth.role() = 'authenticated'`

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in from Supabase > Settings > API:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Only the **anon** (publishable) key is used — never the service role key.

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy to Vercel

```bash
npx vercel
```

Add the same env vars in Vercel > Project > Settings > Environment Variables.

## Downloadable Asset Config

Edit [`src/components/AssetDownloads.jsx`](src/components/AssetDownloads.jsx) to match your filenames in the bucket:

```js
const ASSETS = [
  { id: 'planner-2026', label: '2026 Reading Planner', emoji: '📖', filename: '2026-reading-planner.pdf', bucket: 'reading-assets' },
];
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key — safe to expose, protected by RLS |

## License

MIT — see [LICENSE](LICENSE).

## Commercial Use

For commercial licensing, contact [fazalabbas2002@gmail.com](mailto:fazalabbas2002@gmail.com).
