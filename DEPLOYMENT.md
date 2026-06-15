# Deployment

## Render / Railway easiest

1. Push this folder to GitHub.
2. Create a new Node web service.
3. Build command:

```bash
npm install && npx prisma generate && npx prisma db push && npm run build
```

4. Start command:

```bash
npm start
```

5. Set environment variable:

```env
DATABASE_URL=file:./dev.db
```

For a durable production deployment, use PostgreSQL instead of SQLite.
