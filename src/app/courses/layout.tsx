"use client";

import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <main className="flex-1">{children}</main>
    </AuthProvider>
  );
}
