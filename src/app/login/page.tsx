"use client";

import { authService } from "@/lib/auth-service";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      login(response.user, response.token);
      router.push("/write");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#2C3E50] mb-2">Vellume</h1>
          <p className="text-[#2C3E50]/70">Your pixel art journaling space</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-2 border-[#2C3E50] p-6 bg-white"
        >
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-6">Login</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-[#2C3E50] font-bold mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#2C3E50] bg-white text-[#2C3E50] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2C3E50]"
              placeholder="your@email.com"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-[#2C3E50] font-bold mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#2C3E50] bg-white text-[#2C3E50] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2C3E50]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2C3E50] text-white font-bold py-2 px-4 hover:bg-[#1a252f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          <div className="mt-4 text-center">
            <p className="text-[#2C3E50]/70 text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="font-bold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
