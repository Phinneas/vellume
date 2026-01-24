"use client";

import { AuthLayout } from "@/components/auth-layout";
import { authService } from "@/lib/auth-service";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-[#2C3E50] mb-8">Settings</h1>

        <div className="border-2 border-[#2C3E50] p-6 bg-white mb-6">
          <h2 className="text-xl font-bold text-[#2C3E50] mb-6">
            Account Information
          </h2>

          <div className="mb-6">
            <label className="block text-[#2C3E50] font-bold mb-2">Name</label>
            <input
              type="text"
              value={user?.name || ""}
              disabled
              className="w-full px-4 py-2 border border-[#2C3E50] bg-gray-100 text-[#2C3E50] cursor-not-allowed"
            />
          </div>

          <div className="mb-6">
            <label className="block text-[#2C3E50] font-bold mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-2 border border-[#2C3E50] bg-gray-100 text-[#2C3E50] cursor-not-allowed"
            />
          </div>

          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="px-6 py-2 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing out..." : "Sign Out"}
          </button>
        </div>

        <div className="border-2 border-[#2C3E50] p-6 bg-white">
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4">About</h2>
          <p className="text-[#2C3E50]/70">
            Vellume v1.0 - Your pixel art journaling space
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
