"use client";

import { AuthLayout } from "@/components/auth-layout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface JournalEntry {
  id: string;
  entry_text: string;
  mood: string;
  created_at: string;
  image_url?: string;
}

export default function EntryPage({ params }: { params: { id: string } }) {
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchJournal = async () => {
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
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch journal");
        }

        const journals: JournalEntry[] = await response.json();
        const foundJournal = journals.find((j) => j.id === params.id);

        if (!foundJournal) {
          throw new Error("Journal entry not found");
        }

        setJournal(foundJournal);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch journal");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJournal();
  }, [params.id, router]);

  const handleDelete = async () => {
    try {
      setError(null);

      // Get token from localStorage (Better Auth)
      const token = localStorage.getItem("betterAuthToken");

      const response = await fetch(`${API_URL}/api/journals/${params.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete journal");
      }

      // Redirect to gallery after deletion
      router.push("/gallery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete journal");
      console.error("Delete error:", err);
    }
  };

  const handleDownloadImage = () => {
    if (!journal?.image_url) return;

    const link = document.createElement('a');
    link.href = journal.image_url;
    link.download = `journal-${params.id}.png`;
    link.click();
  };

  const handleShare = async () => {
    try {
      if (!journal) return;

      if (!navigator.share) {
        throw new Error("Web Share API not supported in your browser");
      }

      await navigator.share({
        title: 'My Journal Entry',
        text: journal.entry_text.substring(0, 100),
        url: window.location.href,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share journal");
      console.error("Share error:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              Error loading journal
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

  if (!journal) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📝</div>
            <h1 className="text-3xl font-bold text-[#2C3E50] mb-4">
              Journal not found
            </h1>
            <p className="text-[#2C3E50]/70 mb-8">
              The journal entry you're looking for doesn't exist.
            </p>
            <a
              href="/gallery"
              className="inline-block px-6 py-3 bg-[#2C3E50] text-white font-bold hover:bg-[#1a252f] transition-colors"
            >
              Back to Gallery
            </a>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="p-4 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#2C3E50]">Journal Entry</h1>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-red-500 text-white font-bold hover:bg-red-600 transition-colors rounded"
          >
            Delete
          </button>
        </div>

        {journal.image_url && (
          <div className="mb-6 flex justify-center">
            <img
              src={journal.image_url}
              alt="Journal pixel art"
              className="max-w-[512px] w-full border-2 border-[#2C3E50]"
            />
          </div>
        )}

        <div className="bg-white border-2 border-[#2C3E50] rounded-lg p-6 mb-6">
          <div className="text-sm text-[#2C3E50]/70 mb-4">
            Created: {formatDate(journal.created_at)}
          </div>
          <div className="text-sm text-[#2C3E50]/70 mb-4">
            Mood: {journal.mood}
          </div>
          <div className="text-[#2C3E50] whitespace-pre-wrap">
            {journal.entry_text}
          </div>
        </div>

        <div className="flex justify-end gap-4 mb-6">
          {journal.image_url && (
            <button
              onClick={handleDownloadImage}
              className="px-6 py-2 bg-[#3498db] text-white font-bold hover:bg-[#2980b9] transition-colors"
            >
              Download Image
            </button>
          )}
          <button
            onClick={handleShare}
            className="px-6 py-2 bg-[#9b59b6] text-white font-bold hover:bg-[#8e44ad] transition-colors"
          >
            Share
          </button>
          <a
            href="/gallery"
            className="inline-block px-6 py-3 bg-[#2C3E50] text-white font-bold hover:bg-[#1a252f] transition-colors"
          >
            Back to Gallery
          </a>
        </div>

        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-sm">
              <h3 className="text-xl font-bold text-[#2C3E50] mb-4">
                Confirm Delete
              </h3>
              <p className="text-[#2C3E50]/70 mb-6">
                Are you sure you want to delete this journal entry? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 border-2 border-[#2C3E50] text-[#2C3E50] font-bold hover:bg-[#F4EBD9] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}