"use client";

import { useState } from "react";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use relative URL directly (not apiClient) to ensure the cookie
      // is set for the current origin, regardless of NEXT_PUBLIC_API_URL
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Login failed" }));
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Login successful - full page redirect ensures middleware sees the cookie
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/";
      window.location.href = redirect;
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-zinc-800 bg-zinc-950 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-50">Mission Control</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md border border-red-800 bg-red-950/50 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-300"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-50 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                placeholder="paul@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-50 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 space-y-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="text-xs font-medium text-zinc-400">Demo Credentials:</p>
          <div className="space-y-1 text-xs text-zinc-500">
            <p><span className="font-mono text-zinc-400">paul@example.com</span> / Password123! (Admin)</p>
            <p><span className="font-mono text-zinc-400">logan@example.com</span> / Password123! (Developer)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
