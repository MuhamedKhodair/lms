# LMS - Learning Management System

A full-stack Learning Management System built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **PostgreSQL**, and **Prisma 7**.

## Features

- **Auth** — Register, login, JWT tokens, role-based access (Admin, Instructor, Student), forgot/reset password
- **Courses** — Create/edit courses, modules, and lessons (text, video, file attachments)
- **Enrollment** — Students enroll and track progress per course
- **Quizzes** — Multiple-choice and short-answer quizzes with auto-grading, quiz builder for instructors
- **Discussions** — Course-level Q&A with sorting; per-lesson comments
- **Notifications** — Bell dropdown + full `/notifications` page
- **Certificates** — Auto-generated PDF download on course completion
- **Search & Filter** — Search by title/description, filter by category
- **Admin Panel** — Manage users and courses with pagination
- **Dark mode** — Toggle in header (light / dark / system)
- **Rate limiting** — Applied to auth and upload endpoints
- **File upload** — Instructor file attachments (PDF, images, video, docs)
- **Email hooks** — Dev-mode mailer abstraction (ready for nodemailer/Resend/SES)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 (custom `@custom-variant` dark mode) |
| Backend | Next.js API Routes (Node.js runtime) |
| Database | PostgreSQL via Prisma 7 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod |
| PDFs | pdfkit |
| Tests | Vitest |

## Getting Started

### Prerequisites

- Node.js 20.9+
- PostgreSQL 14+ (running)
- npm

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# 3. Create the database
createdb lms        # or via psql

# 4. Run migrations
npx prisma migrate dev

# 5. Seed
npx prisma db seed

# 6. Start dev server
npm run dev
```

Open http://localhost:3000

### Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lms.com | password123 |
| Instructor | instructor@lms.com | password123 |
| Student | student@lms.com | password123 |

## Testing

```bash
npm test        # vitest run
npm run lint    # eslint
npm run build   # production build
```

## Project Structure

```
src/
  app/                      # Next.js App Router
    api/                    # REST API routes
      auth/                 # register, login, me, forgot/reset-password
      courses/              # courses + modules + enroll + progress
      lessons/              # lessons + progress
      quizzes/              # quizzes + attempts
      discussions/          # course discussions
      comments/             # lesson comments
      notifications/        # in-app notifications
      certificates/         # issue + download
      users/                # profile + certificates
      admin/                # admin management
      upload/               # file upload
    (auth)/                 # login, register, forgot/reset password
    (dashboard)/            # dashboard, admin, settings, notifications, quizzes
    courses/                # course listing, detail, new course, new quiz
    lessons/                # standalone lesson page
    globals.css             # Tailwind theme + custom variant dark
    layout.tsx              # Root layout (ThemeProvider + AuthProvider)
    page.tsx                # Landing page
  components/
    layout/header.tsx       # Header with theme toggle & notification bell
    footer.tsx              # Footer
    course-card.tsx         # Course card (reusable)
    module-accordion.tsx    # Modules + lessons accordion
    pagination.tsx          # Reusable pagination
    progress-bar.tsx        # Progress bar
    certificate-card.tsx    # Certificate display + download
    discussion-thread.tsx   # Course discussion list + create form
    quiz-player.tsx         # Interactive quiz taker
    notification-bell.tsx   # Header bell with dropdown
    file-upload.tsx         # File upload widget
    theme-toggle.tsx        # Dark mode toggle button
  lib/
    auth-context.tsx         # React auth context (login/register/updateProfile)
    auth.ts                  # Server-side JWT helpers
    db.ts                    # Prisma client (singleton)
    utils.ts                 # Zod schemas, pagination, apiSuccess, apiError
    rate-limit.ts            # In-memory sliding window rate limiter
    email.ts                 # Dev mailer abstraction
    theme-context.tsx        # Light/dark/system theme provider
  types/                    # Shared TypeScript types
prisma/
  schema.prisma             # DB schema (users, courses, modules, lessons, quizzes, attempts, certificates, discussions, comments, notifications, password reset tokens)
  migrations/               # Versioned migrations
  seed.ts                    # Seed script
prisma.config.ts            # Prisma config (datasource, migrations, seed)
tests/                      # Vitest unit tests
vitest.config.ts           # Vitest config
```

## API Routes (comprehensive)

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/forgot-password | Send password reset link |
| POST | /api/auth/reset-password | Reset password with token |
| GET/POST | /api/courses | List / create courses |
| GET/PUT/DELETE | /api/courses/[id] | Get / update / delete a course |
| POST | /api/courses/[id]/enroll | Enroll in a course |
| GET/POST | /api/courses/[id]/modules | List / add modules |
| GET | /api/courses/[id]/progress | Course progress for current user |
| POST | /api/modules/[id]/lessons | Add a lesson to a module |
| GET/PUT | /api/lessons/[id] | Get / update lesson |
| GET/POST | /api/lessons/[id]/progress | Mark lesson complete |
| GET/POST | /api/quizzes | List / create quizzes |
| GET | /api/quizzes/[id] | Get quiz (for taking) |
| POST | /api/quizzes/[id]/attempt | Submit a quiz attempt |
| POST | /api/certificates | Issue a certificate |
| GET | /api/certificates/[id]/download | Download certificate PDF |
| GET | /api/users/[id]/certificates | List user certificates |
| GET/PUT/POST | /api/users/me | Get / update profile; POST to change password |
| GET/POST | /api/discussions | List (filter by courseId) / create discussion |
| POST | /api/comments | Add comment to lesson |
| GET/POST | /api/notifications | List / create notifications |
| GET/PUT/DELETE | /api/notifications/[id] | Read / mark read / delete notification |
| GET | /api/admin/users | Admin: list users |
| GET | /api/admin/courses | Admin: list courses |
| POST | /api/upload | Upload a file (attachments, images) |

## License

MIT
