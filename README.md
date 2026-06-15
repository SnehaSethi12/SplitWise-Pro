# SplitWise Pro — Full-stack Next.js version

A full-stack shared expenses app for the Spreetail assignment. It keeps the same compact SplitWise Pro UI/theme from the Python prototype, but is now built with Next.js, React, Prisma, and SQLite.

## Tech stack

- Next.js App Router
- React server components + server actions
- Prisma ORM
- SQLite relational database for local/demo use
- Inline CSS/SVG charts, no external chart CDN

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Login:

- `admin@example.com`
- `password`

Then go to **Import** and click **Import bundled expenses_export.csv**.

## Deploy
LIVE WORKING URL : https://splitwise-pro-c4ns.onrender.com
deploy to Render/Railway as a Node app, or convert `DATABASE_URL` to a hosted PostgreSQL database and deploy to Vercel.

Local/demo database:

```env
DATABASE_URL="file:./dev.db"
```

PostgreSQL production database requires changing `prisma/schema.prisma` provider to `postgresql` and setting a Neon/Supabase `DATABASE_URL`.
