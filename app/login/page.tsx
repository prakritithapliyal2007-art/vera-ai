"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAuth() {
    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Account created! Check your email if confirmation is required."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        router.push("/");
      }
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md">

        {/* Logo / Heading */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">✦</div>

          <h1 className="text-3xl font-bold">
            VERA AI
          </h1>

          <p className="mt-2 text-white/50">
            {isSignup
              ? "Create your personal AI account"
              : "Welcome back"}
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

          {/* Email */}
          <label className="mb-2 block text-sm text-white/60">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mb-5 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/30"
          />

          {/* Password */}
          <label className="mb-2 block text-sm text-white/60">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mb-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/30"
          />

          {/* Message / Error */}
          {message && (
            <p className="mb-4 text-sm text-white/60">
              {message}
            </p>
          )}

          {/* Main Button */}
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full rounded-xl bg-white py-3 font-medium text-black hover:bg-white/90 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isSignup
              ? "Create Account"
              : "Login"}
          </button>

          {/* Switch Login / Signup */}
          <div className="mt-5 text-center text-sm text-white/50">
            {isSignup
              ? "Already have an account?"
              : "Don't have an account?"}

            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setMessage("");
              }}
              className="ml-2 text-white underline"
            >
              {isSignup ? "Login" : "Sign up"}
            </button>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="mt-6 block w-full text-center text-sm text-white/40 hover:text-white"
        >
          ← Back to NOVA
        </button>

      </div>
    </main>
  );
}