# LMS - Learning Management System

A full-stack Learning Management System built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **PostgreSQL**, and **Prisma 7**.

## Features

- **Auth** — Register, login, JWT-based authentication with role-based access (Admin, Instructor, Student)
- **Course Management** — Create/edit courses, modules, and lessons (text, video, file)
- **Enrollment** — Students enroll in courses
- **Progress Tracking** — Mark lessons complete, track completion percentage
- **Quizzes** — Multiple-choice and short-answer quizzes with auto-grading
- **Discussions** — Course-level Q&A discussions
- **Comments** — Per-lesson comments
- **Notifications** — In-app notifications
- **Certificates** — Auto-generated completion certificates
- **Search & Filtering** — Search courses by title, category
- **Admin Panel** — Manage users and courses

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend | Next.js API Routes |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your database credentials

# 3. Create the database
createdb lms

# 4. Run migrations
npx prisma migrate dev

# 5. Seed the database
npx prisma db seed

# 6. Start the dev server
npm run dev
```

### Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lms.com | password123 |
| Instructor | instructor@lms.com | password123 |
| Student | student@lms.com | password123 |

## Project Structure

```
src/
  app/                    # Next.js App Router
    api/                  # API routes
    (auth)/               # Auth pages (login, register)
    (dashboard)/          # Dashboard pages
    courses/              # Course pages
  components/
    layout/               # Layout components (header)
  lib/                    # Utilities (auth, db, validation)
  types/                  # TypeScript types
prisma/
  schema.prisma           # Database schema
  seed.ts                 # Seed script
  migrations/             # Database migrations
prisma.config.ts          # Prisma configuration
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET/POST | /api/courses | List/create courses |
| GET/PUT/DELETE | /api/courses/[id] | Get/update/delete course |
| POST | /api/courses/[id]/enroll | Enroll in a course |
| GET/POST | /api/courses/[id]/modules | List/add modules |
| GET | /api/courses/[id]/progress | Get course progress |
| POST | /api/modules/[moduleId]/lessons | Add lesson to module |
| GET/PUT | /api/lessons/[id] | Get/update lesson |
| GET/POST | /api/lessons/[id]/progress | Get/mark lesson progress |
| GET/POST | /api/quizzes | List/create quizzes |
| GET/POST | /api/quizzes/[id]/attempt | Submit/get quiz attempts |
| POST | /api/certificates | Issue a certificate |
| GET | /api/users/[id]/certificates | Get user certificates |
| GET/POST | /api/discussions | Course discussions |
| POST | /api/comments | Add comment to lesson |
| GET/POST | /api/notifications | User notifications |
| GET | /api/admin/users | Admin: list users |
| GET | /api/admin/courses | Admin: list courses |
| GET/POST | /api/enrollments | User enrollments |

## License

MIT
