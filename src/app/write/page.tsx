"use client";

import { AuthLayout } from "@/components/auth-layout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function WritePage() {
  const [entry, setEntry] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load from localStorage on mount
  useEffect(() => {
    const savedEntry = localStorage.getItem("journalDraft");
    if (savedEntry) {
      setEntry(savedEntry);
    }
  }, []);

  // Auto-save to localStorage every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (entry.trim()) {
        localStorage.setItem("journalDraft", entry);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [entry]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Get token from localStorage (Better Auth)
      const token = localStorage.getItem("betterAuthToken");
      
      const response = await fetch(`${API_URL}/api/journals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          entry_text: entry,
          mood: "neutral",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save journal entry");
      }

      // Clear draft after successful save
      localStorage.removeItem("journalDraft");
      
      // Redirect to gallery
      router.push("/gallery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="flex-1 p-4 sm:p-8">
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-full bg-white border-2 border-[#2C3E50] text-[#2C3E50] text-lg p-6 focus:outline-none focus:ring-2 focus:ring-[#2C3E50] resize-none"
          />
        </div>

        <div className="border-t-2 border-[#2C3E50] p-4 sm:p-8 bg-white flex justify-end gap-4">
          <button
            onClick={() => setEntry("")}
            className="px-6 py-2 border-2 border-[#2C3E50] text-[#2C3E50] font-bold hover:bg-[#F4EBD9] transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            disabled={!entry.trim() || isSaving}
            className="px-6 py-2 bg-[#2C3E50] text-white font-bold hover:bg-[#1a252f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </AuthLayout>
  );
}
