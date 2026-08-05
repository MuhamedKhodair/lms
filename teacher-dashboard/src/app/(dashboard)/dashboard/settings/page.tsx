"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none";

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    try {
      await updateProfile({ name, email });
      setProfileMsg("Profile updated");
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : "Failed to update profile");
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPassMsg("");
    setPassErr("");
    if (newPassword.length < 6) {
      setPassErr("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassErr("Passwords do not match");
      return;
    }
    const res = await fetch("/api/users/me", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPassErr(data.error || "Failed to change password");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPassMsg("Password changed");
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Settings</h1>
        <p className="mt-1 text-text-muted">
          Your account · <span className="font-medium text-primary">{user.role.toLowerCase()}</span>
        </p>
      </div>

      <form onSubmit={saveProfile} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold text-text">Profile</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Email</label>
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {profileMsg && <p className="text-sm text-emerald-600 dark:text-emerald-400">{profileMsg}</p>}
        {profileErr && <p className="text-sm text-danger">{profileErr}</p>}
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
          Save Profile
        </button>
      </form>

      <form onSubmit={changePassword} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold text-text">Change Password</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Current password</label>
          <input
            type="password"
            className={inputClass}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text">New password</label>
          <input
            type="password"
            className={inputClass}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Confirm new password</label>
          <input
            type="password"
            className={inputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {passMsg && <p className="text-sm text-emerald-600 dark:text-emerald-400">{passMsg}</p>}
        {passErr && <p className="text-sm text-danger">{passErr}</p>}
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
          Update Password
        </button>
      </form>
    </div>
  );
}
