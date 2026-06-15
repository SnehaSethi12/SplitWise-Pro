# Simplification Notes

The code has been formatted and organized for interview readability.

Important simplifications:

1. No external chart library — charts are simple CSS/SVG components in `components/Charts.tsx`.
2. No separate backend server — Next.js Server Actions handle form submissions in `app/actions.ts`.
3. Import logic is isolated in one file: `lib/importer.ts`.
4. Balance math is isolated in one file: `lib/balances.ts`.
5. Shared layout is isolated in one file: `components/Shell.tsx`.
6. Database schema is centralized in `prisma/schema.prisma`.

For the interview, focus on these five files first:

- `prisma/schema.prisma`
- `lib/importer.ts`
- `lib/balances.ts`
- `app/actions.ts`
- `app/page.tsx`
