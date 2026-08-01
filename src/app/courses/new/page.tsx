"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function NewCoursePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role === "STUDENT") {
      router.push("/dashboard");
    }
  }, [user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        category: category || undefined,
        price,
        imageUrl: imageUrl || undefined,
        published: false,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create course");
      return;
    }
    router.push(`/courses/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <h1 className="text-2xl font-bold tracking-tight text-text">Create Course</h1>
          <p className="mt-1 text-text-muted">Set up a new course for your students</p>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text">Title</label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text">Description</label>
            <textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-text">Cover image URL</label>
            <input
              id="imageUrl"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="mt-2 h-32 w-full rounded-lg object-cover border border-border" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">None</option>
                <option value="programming">Programming</option>
                <option value="design">Design</option>
                <option value="business">Business</option>
                <option value="science">Science</option>
                <option value="math">Math</option>
              </select>
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-text">Price ($)</label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all"
          >
            Create Course
          </button>
        </form>
      </div>
    </div>
  );
}
