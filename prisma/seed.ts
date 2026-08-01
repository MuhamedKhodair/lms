import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@lms.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@lms.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "instructor@lms.com" },
    update: {},
    create: {
      name: "John Instructor",
      email: "instructor@lms.com",
      passwordHash,
      role: "INSTRUCTOR",
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@lms.com" },
    update: {},
    create: {
      name: "Jane Student",
      email: "student@lms.com",
      passwordHash,
      role: "STUDENT",
    },
  });

  const course1 = await prisma.course.create({
    data: {
      title: "Introduction to Web Development",
      description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript. Build your first responsive website from scratch.",
      instructorId: instructor.id,
      category: "programming",
      price: 0,
      imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop",
      published: true,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      title: "Advanced React & Next.js",
      description: "Master modern React patterns, server components, and the App Router. Build full-stack applications with Next.js.",
      instructorId: instructor.id,
      category: "programming",
      price: 49.99,
      imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
      published: true,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      title: "Data Science Fundamentals",
      description: "Explore data analysis, visualization, and machine learning with Python. Perfect for beginners in data science.",
      instructorId: instructor.id,
      category: "science",
      price: 0,
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
      published: true,
    },
  });

  const mod1 = await prisma.module.create({
    data: { courseId: course1.id, title: "Getting Started", order: 0 },
  });

  const mod2 = await prisma.module.create({
    data: { courseId: course1.id, title: "HTML Fundamentals", order: 1 },
  });

  const mod3 = await prisma.module.create({
    data: { courseId: course1.id, title: "CSS Styling", order: 2 },
  });

  const lessons = [
    { moduleId: mod1.id, title: "Welcome to the Course", contentType: "text", content: "Welcome to Introduction to Web Development! In this course, you'll learn how to build websites from scratch using HTML, CSS, and JavaScript.\n\nBy the end of this course, you'll be able to create responsive, interactive web pages that look great on any device.", order: 0, duration: 10 },
    { moduleId: mod1.id, title: "Setting Up Your Environment", contentType: "text", content: "Before we start coding, let's set up your development environment.\n\n1. Install a modern web browser (Chrome or Firefox)\n2. Install Visual Studio Code\n3. Create a project folder\n4. Open the folder in VS Code\n\nVS Code has excellent extensions for web development. Install the 'Live Server' extension to see your changes in real-time.", order: 1, duration: 15 },
    { moduleId: mod2.id, title: "What is HTML?", contentType: "video", videoUrl: "https://www.w3schools.com/html/html5_intro.asp", content: "HTML (HyperText Markup Language) is the standard language for creating web pages. It describes the structure of a web page using markup.", order: 0, duration: 20 },
    { moduleId: mod2.id, title: "HTML Tags and Elements", contentType: "text", content: "HTML elements are the building blocks of HTML pages. They are represented by tags.\n\nCommon HTML tags:\n- <h1> to <h6>: Headings\n- <p>: Paragraphs\n- <a>: Links\n- <img>: Images\n- <div>: Division/Section\n- <ul>, <ol>, <li>: Lists", order: 1, duration: 25 },
    { moduleId: mod3.id, title: "Introduction to CSS", contentType: "text", content: "CSS (Cascading Style Sheets) is used to style and layout web pages. It controls the visual appearance of HTML elements.\n\nCSS can be added in three ways:\n1. Inline - using the style attribute\n2. Internal - using a <style> tag in the <head>\n3. External - using a .css file linked with <link>", order: 0, duration: 25 },
  ];

  for (const lesson of lessons) {
    await prisma.lesson.create({ data: lesson });
  }

  const enr = await prisma.enrollment.create({
    data: { userId: student.id, courseId: course1.id },
  });

  const quiz = await prisma.quiz.create({
    data: {
      lessonId: lessons[3].moduleId === mod2.id
        ? (await prisma.lesson.findFirst({ where: { moduleId: mod2.id, order: 1 } }))!.id
        : undefined,
      courseId: course1.id,
      title: "HTML Basics Quiz",
    },
  });

  await prisma.quizQuestion.createMany({
    data: [
      {
        quizId: quiz.id,
        questionText: "What does HTML stand for?",
        type: "multiple_choice",
        optionsJson: JSON.stringify(["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"]),
        correctAnswer: "Hyper Text Markup Language",
        points: 1,
      },
      {
        quizId: quiz.id,
        questionText: "Which tag is used for the largest heading?",
        type: "multiple_choice",
        optionsJson: JSON.stringify(["<heading>", "<h1>", "<h6>", "<head>"]),
        correctAnswer: "<h1>",
        points: 1,
      },
      {
        quizId: quiz.id,
        questionText: "What tag is used to create a hyperlink?",
        type: "multiple_choice",
        optionsJson: JSON.stringify(["<link>", "<a>", "<href>", "<url>"]),
        correctAnswer: "<a>",
        points: 1,
      },
    ],
  });

  await prisma.notification.create({
    data: {
      userId: student.id,
      type: "enrollment",
      message: `You have been enrolled in "${course1.title}"`,
    },
  });

  console.log("Seed complete!");
  console.log("---");
  console.log("Admin: admin@lms.com / password123");
  console.log("Instructor: instructor@lms.com / password123");
  console.log("Student: student@lms.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
