"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { DiscussionThread } from "@/components/discussion-thread";

interface Discussion {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
  replies?: { id: string; content: string; createdAt: string; user: { id: string; name: string } }[];
  _count?: { replies: number };
}

export default function CourseDiscussionsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await fetch(`/api/discussions?courseId=${id}`);
        if (res.ok) {
          const data = await res.json();
          setDiscussions(data);
        }
        // Fetch course title separately
        const courseRes = await fetch(`/api/courses/${id}`);
        if (courseRes.ok) {
          const course = await courseRes.json();
          setCourseTitle(course.title);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [id]);

  const handleCreate = async (title: string, content: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ courseId: id, title, content }),
    });
    if (res.ok) {
      const data = await res.json();
      setDiscussions((prev) => [data, ...prev]);
    }
  };

  const handleReply = async (discussionId: string, content: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/discussions/${discussionId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("Reply failed");
    const newReply = await res.json();
    const author = { id: user?.id || "", name: user?.name || "Unknown" };
    setDiscussions((prev) =>
      prev.map((d) =>
        d.id === discussionId
          ? {
              ...d,
              replies: [...(d.replies || []), { ...newReply, user: author }],
              _count: { replies: (d.replies?.length || 0) + 1 },
            }
          : d
      )
    );
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
        <Link href="/courses" className="hover:text-text transition-colors">Courses</Link>
        <span>/</span>
        <Link href={`/courses/${id}`} className="hover:text-text transition-colors">{courseTitle || "Course"}</Link>
        <span>/</span>
        <span className="text-text font-medium">Discussions</span>
      </nav>

      <DiscussionThread
        discussions={discussions}
        canCreate={!!user}
        onCreate={handleCreate}
        onReply={handleReply}
      />
    </div>
  );
}
