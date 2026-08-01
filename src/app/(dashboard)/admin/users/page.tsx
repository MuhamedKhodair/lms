"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { UserResponse } from "@/types";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user || user.role !== "ADMIN") return;
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`/api/admin/users?page=${page}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const d = json ?? json;
        setUsers(d.data ?? []);
        setTotalPages(d.totalPages ?? 1);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, page]);

  if (!user || user.role !== "ADMIN") return null;

  const roleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-accent/10 text-accent";
      case "INSTRUCTOR": return "bg-primary/10 text-primary";
      default: return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-text">Users</h2>
      <p className="mt-1 text-sm text-text-muted">All registered users on the platform.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-text-muted">Name</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Email</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Role</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <span className="inline-block h-4 w-24 animate-pulse rounded bg-surface" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-muted">No users found.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text">{u.name}</td>
                  <td className="px-4 py-3 text-text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColor(u.role)}`}>
                      {u.role.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
