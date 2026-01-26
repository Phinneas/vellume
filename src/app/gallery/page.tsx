"use client";

import { AuthLayout } from "@/components/auth-layout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vellume-api.buzzuw2.workers.dev";

interface JournalEntry {
  id: string;
  entry_text: string;
  mood: string;
  created_at: string;
  image_url?: string;
}

export default function GalleryPage() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get token from localStorage (Better Auth)
        const token = localStorage.getItem("betterAuthToken");

        const response = await fetch(`${API_URL}/api/journals`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch journals");
        }

        const data = await response.json();
        setJournals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch journals");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJournals();
  }, []);

  const handleCardClick = (id: string) => {
    router.push(`/entry/${id}`);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCardBackground = (journal: JournalEntry) => {
    if (journal.image_url) {
      return {
        backgroundImage: `url(${journal.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      backgroundColor: '#F4EBD9',
    };
  };

  const getCardContent = (journal: JournalEntry) => {
    if (journal.image_url) {
      return (
        <div className="w-full h-full flex items-end p-4 bg-black bg-opacity-50">
          <div className="text-white">
            <div className="text-sm mb-2">
              {formatDate(journal.created_at)}
            </div>
            <div className="text-lg font-bold mb-2">
              {truncateText(journal.entry_text, 50)}
            </div>
          </div>
        </div>
      );
    }

    // Fallback for entries without images
    const firstLetter = journal.entry_text.trim().charAt(0).toUpperCase();
    return (
      <div className="w-full h-full flex flex-col justify-between p-4">
        <div className="flex justify-center items-center h-24">
          <div className="w-16 h-16 bg-[#2C3E50] text-[#F4EBD9] rounded flex items-center justify-center text-2xl font-bold">
            {firstLetter}
          </div>
        </div>
        <div>
          <div className="text-sm text-[#2C3E50]/70 mb-2">
            {formatDate(journal.created_at)}
          </div>
          <div className="text-[#2C3E50] mb-4">
            {truncateText(journal.entry_text)}
          </div>
          <div className="text-xs text-[#2C3E50]/50">
            Mood: {journal.mood}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="text-2xl mb-4">Loading...</div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-[#2C3E50] mb-4">
              Error loading journals
            </h1>
            <p className="text-[#2C3E50]/70 mb-8">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-block px-6 py-3 bg-[#2C3E50] text-white font-bold hover:bg-[#1a252f] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (journals.length === 0) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📝</div>
            <h1 className="text-3xl font-bold text-[#2C3E50] mb-4">
              No entries yet
            </h1>
            <p className="text-[#2C3E50]/70 mb-8">
              Write your first journal entry to see it transformed into pixel art!
            </p>
            <a
              href="/write"
              className="inline-block px-6 py-3 bg-[#2C3E50] text-white font-bold hover:bg-[#1a252f] transition-colors"
            >
              Start Writing
            </a>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="p-4 sm:p-8">
        <h1 className="text-3xl font-bold text-[#2C3E50] mb-8">Your Journal Entries</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journals.map((journal) => (
            <div
              key={journal.id}
              onClick={() => handleCardClick(journal.id)}
              className="border-2 border-[#2C3E50] rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow h-64 flex"
              style={getCardBackground(journal)}
            >
              {getCardContent(journal)}
            </div>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
