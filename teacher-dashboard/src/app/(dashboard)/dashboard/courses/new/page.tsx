"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const categories = ["programming", "design", "business", "science", "math"];

export default function NewCoursePage() {
  const router = useRouter();
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
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
          price: price ? Number(price) : 0,
          imageUrl: imageUrl || undefined,
          published: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create course");
      router.push(`/dashboard/courses/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text">Create a Course</h1>
        <p className="mt-1 text-text-muted">Start building your course as a draft.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-text" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Web Development"
            required
            minLength={3}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className={`${inputClass} min-h-28`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will students learn?"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text" htmlFor="price">
              Price (USD)
            </label>
            <input
              id="price"
              type="number"
              min={0}
              className={inputClass}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0 = free"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text" htmlFor="imageUrl">
            Cover Image URL
          </label>
          <input
            id="imageUrl"
            className={inputClass}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />
          {imageUrl && (
            <div className="mt-3 h-32 w-full overflow-hidden rounded-lg border border-border bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
