# LMS Deep Audit — Missing Workflows, Incomplete Parts & Known Issues

**Audited**: August 2026 · **Stack**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma 7, PostgreSQL, JWT auth, Zod, Vitest  
**App state**: Builds, runs, seeds, login/course/quiz/notifications/discussions/certificates work. Core workflows are complete, but several features are **shallow, partially wired, or production-fragile**. This audit covers what's *missing*, *incomplete*, or *risky* — not a feature list.

---

## ✅ Completed Since Audit (Aug 2026)

| Item | What was done |
|------|---------------|
| Critical #3 — Discussion replies | Added `Reply` model + migration, `POST /api/discussions/[id]/replies`, reply UI in `DiscussionThread` and course detail page. |
| Critical #6 — Admin actions | Fixed admin users/courses data bugs (users never displayed; pagination broken). Added role edit + delete user, publish toggle + delete course via new `/api/admin/users/[id]` and `/api/admin/courses/[id]` routes. |
| High #7 — Lesson/module edit-delete | Added `DELETE /api/lessons/[id]`, `PUT|DELETE /api/modules/[id]`, and per-lesson/per-module edit + delete UI on the course detail page. |
| High #10 — Quiz result UX | `POST /api/quizzes/[id]/attempt` now returns per-question results; `QuizPlayer` shows a full question breakdown (your answer vs correct answer). |
| Quiz → lesson progress | Submitting a lesson-attached quiz now marks that lesson complete (course detail page + standalone `/quizzes/[id]`). |
| Course-level quizzes | `GET /api/quizzes` added (filter by `courseId`/`lessonId`); course page surfaces course-level quizzes in a "Course Quizzes" section. |
| Email hooks | `welcomeEmail` sent on register; `enrollmentEmail` + success notification sent on enrollment. |

---

## ✅ What Exists (Complete Workflows)

| Feature | Pages | API | Notes |
|----------|-------|-----|-------|
| Auth (register/login/logout) | `/login`, `/register`, `/forgot-password`, `/reset-password` | `/api/auth/*` | JWT in localStorage + cookie; rate-limited |
| Courses (list/search/create/view) | `/courses`, `/courses/[id]`, `/courses/new` | `/api/courses`, `/api/courses/[id]` | Search, pagination, enrollment, progress |
| Quizzes (create/take/grade) | `/courses/[id]/quizzes/new`, `/quizzes/[id]` | `/api/quizzes`, `/api/quizzes/[id]`, `/api/quizzes/[id]/attempt` | Auto-grade, result shown |
| Lessons (view/track) | `/lessons/[id]` + inline | `/api/lessons/[id]`, `/api/lessons/[id]/progress` | Marks complete, comments |
| Discussions | `/courses/[id]/discussions` | `/api/discussions` | Create/list; no replies |
| Notifications | `/notifications` | `/api/notifications`, `/api/notifications/[id]` | Bell dropdown + full page |
| Certificates | `/settings` (certificates tab) | `/api/certificates`, `/api/users/[id]/certificates`, `/api/certificates/[id]/download` | PDF generation via pdfkit |
| Settings | `/settings` | `/api/users/me` (GET/PUT/POST) | Profile, password, certificates, notification tabs |
| Admin | `/admin`, `/admin/users`, `/admin/courses` | `/api/admin/*` | Stats, tables, pagination |
| File upload | lesson form (accordion) | `/api/upload` | 10MB, allowlist types, UUID filename |
| Rate limiting | auth, upload | `src/lib/rate-limit.ts` | In-memory, IP-keyed, TTL |
| Dark mode | toggle in header | N/A | `.dark` class on `<html>`, `localStorage` |
| Email (dev only) | — | `src/lib/email.ts` | Console mailer — no production provider |

---

## 🔴 CRITICAL (Breaks UX, incomplete workflows)

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 1 | **Course detail page** | No instructor-only **Edit/Delete** buttons → instructors can’t update a course without reusing add-module modal (not course edit). | Add course-level Edit/Delete CTA (conditional on `user.id === course.instructorId`) and proper modal. |
| 2 | **Quiz completion → lesson progress** | QuizPlayer doesn’t mark the lesson complete when submitted. So a student who only does the quiz never counts toward course progress. | On quiz submit, call `/api/lessons/{lessonId}/progress` when quiz belongs to a lesson. |
| 3 | **Discussion replies** | `DiscussionThread` lists posts but offers no way to comment/reply. Discussions are flat. | ✅ **DONE** — `Reply` model + API + UI. |
| 4 | **Courses page pagination missing** | `/courses` only renders `data.data` (which is undefined from API) → no courses displayed. Backend returns `data` shape incorrectly. | *Already worked — courses render + pagination function correctly.* |
| 5 | **Enroll button not dynamic** | `enrolled` state set once at mount; doesn’t disable after enrolling. Button remains clickable and shows same text. | Disable button and show “Enrolled” after successful enroll (persist state after `handleEnroll`). |
| 6 | **Admin users/courses – no edit/delete** | Admin pages are read-only tables. No way to update user role, delete course, unenroll. | ✅ **DONE** — role edit, delete user, publish toggle, delete course.

---

## 🟠 HIGH (Broken UX or partially implemented)

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 7 | **Lesson edit/reorder** | ModuleAccordion only allows adding lessons; no edit/delete per lesson. Instructors can’t fix mistakes. | ✅ **DONE** — `DELETE /api/lessons/[id]`, `PUT|DELETE /api/modules/[id]`, edit/delete UI on course detail page. |
| 8 | **Discussion sorting** | `/courses/[id]/discussions` returns no sort/order; frontend assumes newest-first. | Client-side Newest/Oldest toggle exists. |
| 9 | **Notification “mark all read”** | Bell dropdown lists items but no bulk mark-read. Users click one-by-one. | Mark-all-read exists (per-item PUT loop). |
| 10 | **Quiz result UX** | After submitting, only alert shows. No score breakdown, no per-question correctness, no retake guard. | ✅ **DONE** — per-question breakdown in `QuizPlayer`; retake present. |
| 11 | **File upload UX** | Upload returns a file URL, but UI doesn’t show previously uploaded files or allow re-upload. | Track previously uploaded file URL in lesson edit; show name + download link in accordion. |
| 12 | **Certificate share/verify** | Certificate page only downloads PDF; no share link/QR/verify slug. | Add verify page: `/verify/[certId]` returning issuing info (DB lookup). |

---

## 🟡 MEDIUM (Polish, missing states, inconsistency)

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 13 | **No `global-not-found.tsx`** | Root `not-found.tsx` exists, but `global-not-found` disabled; URLs like `/nonexistent` fallback to default Next 404. | Enable via `next.config.ts` or keep root `not-found` handling. |
| 14 | **`console.log` everywhere** | `console.log` used for errors in nearly every API → production logs messy. | Replace all `console.log` with a real logger (e.g., Pino) or `NextResponse.error`. |
| 15 | **`apiSuccess` vs `apiError` shape inconsistent** | Some routes return objects, some strings; inconsistent `data` fields. | Standardize: `success: boolean`, `data?`, `error?`, `meta?` (page/total/limit). |
| 16 | **No `.env.example`** | Docs assume `.env.example` exists but none. | Add `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NEXT_PUBLIC_APP_URL`, `SMTP_*`. |
| 17 | **Poor empty states** | Courses page, notifications page, certificates tab show nothing (or generic) on no data. | Add friendly empty states + “Create something” CTA. |
| 18 | **Hardcoded pagination page size** | Courses list defaults to 12; admin pages hardcoded differently (10). | Expose `limit` via UI dropdown/config. |
| 19 | **Progress not synced across modules** | Course page shows overall progress bar inline within module; global dashboard progress not reflected. | Compute progress per course on dashboard; display per-module totals. |

---

## 🔵 LOW (Minor issues / cleanup)

| # | Area | Issue | Fix |
|---|------|-------|-----|
| 20 | **Unused seeds/migrations missing** | `prisma/seed.ts` exists but no `npx prisma db seed` in `package.json` scripts in docs — README needs step. | Ensure `.env` doc lists `npx prisma db seed`. |
| 21 | **Type ambiguity** | Many `Record<string, unknown>` casts in pages (especially discussions) — should be strict. | Define proper `DiscussionType` and `QuizAttemptType` in `src/types/index.ts`. |
| 22 | **`window.confirm` used for delete** | Some delete actions use `window.confirm`; better to use accessible modal (manage dialog). | Switch to modal pattern everywhere. |
| 23 | **No “rate limit exceeded” UX** | 429 responses return plain JSON; no UI handling in login/register. | Add a `<toast>` “Too many requests, try later.” component on `503/429`. |
| 24 | **Auth pages inconsistent** | Register/login/auto-login duplicated logic and redirects (`/dashboard` hard-coded). | Refactor both to use `updateProfile` correctly and redirect back to original path (`router.back()`). |
| 25 | **PDF styling** | Certificate PDF uses fixed font sizes; strange margins on short titles. | Add dynamic font-sizing, shrink/expand border pages. |
| 26 | **No tailwind dark variables for custom colors** | `bg-primary`/`bg-accent` unresolved in dark mode. | Define CSS variables that switch values in dark mode. |

---

## Architecture / Diagram Issues

###  Backend Routing Pattern
- **Nested routes are inconsistent**: ` /api/courses/[id]/modules/lessons/route.ts` handles `POST` only; there is no `GET `/api/courses/[id]/modules` endpoint (lessons are preceded by modules but lessons read via lessonId).  
  **Fix:** Add `GET /api/courses/[id]/modules` returning module-lesson tree.

###  Discussion Threading
- Discussions are single-level records; the schema contains `Discussion` but **no `Reply`** model. UI doesn't support comments.  
  **Fix:** Add `Reply` model + `parentDiscussionId` or nested `comments` table.

###  Certificate Workflow
- No verification status (`pending → issued → revoked`) so admin cannot revoke certificates. Full lifecycle is “issue and forget.”  
  **Fix:** Add `status` enum to `Certificate` + API endpoints to approve/reject/download.

###  Progress Tracking
- `Progress` upsert **overwrites** completion timestamp on POST progress. No attempt history.  
  **Fix:** Store attempt count, timestamps array, or separate history model.

---

## API Coverage Summary

- **Login** → `/api/auth/login` ✅ (rate-limited, JWT, sets cookie)
- **Register** → `/api/auth/register` ✅ (returns token + user)
- **Forgot/Reset password** → `/api/auth/forgot-password` + `/api/auth/reset-password` ✅ (stores token in `PasswordResetToken`)
- **List courses** → `/api/courses` (with `search`, `category`, `page`, `mine`) ✅
- **Get course** → `/api/courses/[id]` ✅ (incl instructor)
- **Create course** → `/api/courses` POST (instructor/admin only) ✅
- **Enroll/Unenroll** → `/api/courses/[id]/enroll` POST ✅ + `/api/courses/[id]/enroll` GET ✅
- **Add module** → `/api/courses/[id]/modules/all` POST ✅ (full module module with lessons)
- **Add lesson** → `/api/modules/[moduleId]/lessons` POST ✅ (order auto, title/content/type)
- **Get lesson** → `/api/lessons/[id]` (incl comments, quizzes, progress, module info) ✅
- **Mark lesson complete** → `/api/lessons/[id]/progress` POST ✅
- **Quiz create** → `/api/quizzes` POST (title + questions JSON) ✅ (quizSchema + questionSchema reference)
- **Quiz attempt** → `/api/quizzes/[id]/attempt` POST (answers → score / attempts array) ✅
- **Discussion list/create** → `/api/discussions` (GET: list; POST: create) ✅
- **Comment (lesson)** → `/api/comments` POST ✅
- **Notification list/create** → `/api/notifications` (GET: list; POST: create) ✅
- **User profile** → `/api/users/me` (GET profile, PUT update, POST password change) ✅
- **Certificates** → `/api/certificates` (POST issue); `/api/users/[id]/certificates` (GET list) ✅
- **Download PDF** → `/api/certificates/[id]/download` (GET certificate as PDF) ✅
- **Admin list users/courses** → `/api/admin/users`, `/api/admin/courses` ✅
- **Upload** → `/api/upload` POST (multipart form → stores in `public/uploads`) ✅

---

## Next Steps for Production Readiness

1. **Add course edit/delete buttons** (instructor only) on course page → UI + API endpoint to update/delete course.
2. **Add quiz result card** with per-question breakdown and mark-lesson-complete on submission.
3. **Fix `/courses` pagination** — return correct pagination result (total, pages) and render `<Pagination>`.
4. **Implement discussion replies** — `Reply` model, API, and UI thread.
5. **Admin action hooks** — edit/delete user/course UI and backend endpoints.
6. **Centralize logging** — replace `console.log` with structured logger; validate env via zod.
7. **Env validation** — add `.env.example` + enforce required envs using `zod` at startup.
8. **Token strategy** — move JWT to short-lived access tokens + refresh tokens; rotate and expire cookies safely.
9. **Test everything** — expand Vitest coverage to auth, upload, quiz, upload endpoints.
10. **Email production**: swap dev mailer for Resend/SES and queue emails on registration/enrollment/certificate issuance.

---

## Summary Table

| Category | Missing / Incomplete | Present |
|----------|----------------------|---------|
| **Core CRUD** | course edit/delete UI; lesson edit; discussion replies | course view/create, module/lesson add, quiz create |
| **Progress** | quiz completion → lesson progress link | overall course progress bar |
| **UX** | course list pagination; result cards; mark all notifications read; empty states; share | course search/filter, dashboard summary |
| **Security** | production-safe secrets; refresh tokens; CSRF | JWT, rate-limit, input validation |
| **Email** | production provider; registration/enrollment mails | dev console, reset password email setup |
| **Docs** | page structure guide | setup, endpoints, AGENTS.md |

---

**Bottom line**: the app is functional and builds cleanly, but it’s thin around **course management, quiz feedback, discussion threading, and admin edits** — those need UI + API wiring to go from “demo” to “production-ready.”