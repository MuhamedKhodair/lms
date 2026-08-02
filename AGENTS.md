<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Overview

Full-stack Learning Management System:
- **Next.js 16** (App Router) · **React 19** · **Tailwind CSS v4** (custom variant dark mode) · **Prisma 7** + **PostgreSQL** · **JWT auth** · **Zod** validation

## Setup Commands

```bash
npm install                    # deps
npx prisma migrate dev         # migrations
npx prisma db seed             # seed (3 users, 3 courses)
npm run dev                    # dev server (http://localhost:3000)
npm run build                  # production build
npm test                       # vitest unit tests
```

## Critical Behaviors

- **Prisma**: after any schema change, run `npx prisma generate` to regenerate the client
- **Database**: must be running and credentials in `.env` (see `.env.example`)
- **Dark mode**: toggles via `.dark` class on `<html>`, persisted in `localStorage` under `theme`, using `@custom-variant dark (&:is(.dark *))` in globals.css
- **Rate limiting**: applied to auth endpoints (login: 8/min, register: 5/min, forgot/reset: 4-6 per 5min) via `src/lib/rate-limit.ts`
- **File upload**: stored in `public/uploads/` with UUID-prefixed names; 10 MB limit; non-student only
- **PDF certificates**: generated on-the-fly via pdfkit at `/api/certificates/[id]/download`
- **Emails**: dev-mode console mailer in `src/lib/email.ts` — swap for a real provider in production
- **Auth flow**: JWT lives in `localStorage` + cookie (proxy middleware uses cookie); server routes use `Authorization: Bearer` header

## Testing

```bash
npm test                       # all tests
npx vitest run tests/utils.test.ts   # one file
```

## Progress Tracking

Use the task list when implementing changes: mark completed when done, pending for phased work, and keep exactly one in_progress.
