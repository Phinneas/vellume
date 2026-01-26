"use client";

import { AuthLayout } from "@/components/auth-layout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generatePixelArt, dataURLToBlob } from "@/lib/pixelart";
import { useAuthStore } from "@/lib/store";
import { authService } from "@/lib/auth-service";
import { Sparkles, Zap } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Style presets for cloud AI generation
const STYLE_PRESETS = [
  { id: 'default', name: 'Classic Pixel', description: 'Standard pixel art style' },
  { id: 'gameboy', name: 'Game Boy', description: 'Green monochrome palette' },
  { id: 'nes', name: 'NES', description: '8-bit limited colors' },
  { id: 'commodore', name: 'Commodore 64', description: 'CRT monitor effect' },
];

export default function WritePage() {
  const [entry, setEntry] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCloudGenerating, setIsCloudGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pixelArt, setPixelArt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const router = useRouter();
  
  const { token, subscription, usage, setSubscription, setUsage } = useAuthStore();
  const isPremium = subscription?.status === 'active';
  const isAtLimit = !isPremium && (usage?.images_this_week ?? 0) >= (usage?.limit ?? 3);

  // Load from localStorage on mount and fetch user data
  useEffect(() => {
    const savedEntry = localStorage.getItem("journalDraft");
    if (savedEntry) {
      setEntry(savedEntry);
    }

    // Fetch user data
    const fetchData = async () => {
      if (token) {
        try {
          const data = await authService.getUserMe(token);
          setSubscription(data.subscription);
          setUsage(data.usage);
        } catch (err) {
          console.error('Failed to fetch user data:', err);
        }
      }
    };
    fetchData();
  }, [token, setSubscription, setUsage]);

  // Auto-save to localStorage every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (entry.trim()) {
        localStorage.setItem("journalDraft", entry);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [entry]);

  const checkUsageLimit = (): boolean => {
    if (isPremium) return true;
    if (isAtLimit) {
      setShowPaywall(true);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
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

  const handleGeneratePixelArt = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      if (!entry.trim()) {
        setError("Please enter some text to generate pixel art");
        return;
      }

      if (!checkUsageLimit()) return;
      
      const art = await generatePixelArt(entry);
      setPixelArt(art);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate pixel art");
      console.error("Pixel art generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCloudArt = async () => {
    if (!entry.trim()) {
      setError("Please enter some text to generate pixel art");
      return;
    }

    if (!isPremium) {
      setShowPaywall(true);
      return;
    }

    try {
      setIsCloudGenerating(true);
      setError(null);

      // First save the journal entry
      const journalResponse = await fetch(`${API_URL}/api/journals`, {
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

      if (!journalResponse.ok) {
        throw new Error("Failed to save journal entry");
      }

      const journalData = await journalResponse.json();
      const journalId = journalData.id;

      // Generate cloud AI image
      const response = await fetch(`${API_URL}/api/images/generate-cloud`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          entry_text: entry,
          journal_id: journalId,
          style: selectedStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setShowPaywall(true);
          return;
        }
        throw new Error(data.error?.message || "Failed to generate cloud art");
      }

      setPixelArt(data.image_url);
      
      // Refresh usage data
      if (token) {
        const userData = await authService.getUserMe(token);
        setUsage(userData.usage);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate cloud art");
      console.error("Cloud generation error:", err);
    } finally {
      setIsCloudGenerating(false);
    }
  };

  const handleSaveWithImage = async () => {
    try {
      setIsUploading(true);
      setError(null);
      
      if (!pixelArt) {
        setError("No pixel art generated");
        return;
      }

      if (!checkUsageLimit()) return;

      // First save the journal entry
      const journalResponse = await fetch(`${API_URL}/api/journals`, {
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

      if (!journalResponse.ok) {
        throw new Error("Failed to save journal entry");
      }

      const journalData = await journalResponse.json();
      const journalId = journalData.id;

      // Convert pixel art to blob and upload
      const blob = dataURLToBlob(pixelArt);
      const formData = new FormData();
      formData.append('journal_id', journalId);
      formData.append('image', blob, 'pixelart.png');

      const uploadResponse = await fetch(`${API_URL}/api/images/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        if (uploadResponse.status === 403) {
          setShowPaywall(true);
          return;
        }
        throw new Error("Failed to upload image");
      }

      // Refresh usage data
      if (token) {
        const userData = await authService.getUserMe(token);
        setUsage(userData.usage);
      }

      // Clear draft after successful save
      localStorage.removeItem("journalDraft");
      
      // Redirect to gallery
      router.push("/gallery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry with image");
      console.error("Save with image error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Usage indicator for free users */}
        {!isPremium && usage && (
          <div className="bg-[#2C3E50] text-[#F4EBD9] px-4 py-2 flex justify-between items-center">
            <span className="font-mono text-sm">
              {usage.images_this_week}/{usage.limit} images this week
            </span>
            <button
              onClick={() => router.push('/pricing')}
              className="bg-[#F4EBD9] text-[#2C3E50] px-3 py-1 rounded-full text-sm font-mono font-bold hover:bg-white transition-colors"
            >
              Upgrade
            </button>
          </div>
        )}

        <div className="flex-1 p-4 sm:p-8">
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-full bg-white border-2 border-[#2C3E50] text-[#2C3E50] text-lg p-6 focus:outline-none focus:ring-2 focus:ring-[#2C3E50] resize-none font-mono"
          />
          
          {pixelArt && (
            <div className="mt-6 flex justify-center">
              <img
                src={pixelArt}
                alt="Generated pixel art"
                className="max-w-[512px] w-full border-2 border-[#2C3E50]"
              />
            </div>
          )}
        </div>

        <div className="border-t-2 border-[#2C3E50] p-4 sm:p-8 bg-white">
          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={() => setEntry("")}
              className="px-6 py-2 border-2 border-[#2C3E50] text-[#2C3E50] font-bold font-mono hover:bg-[#F4EBD9] transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleGeneratePixelArt}
              disabled={!entry.trim() || isGenerating || isCloudGenerating}
              className="px-6 py-2 bg-[#3498db] text-white font-bold font-mono hover:bg-[#2980b9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating..." : "Generate (Instant)"}
            </button>
            
            {/* Cloud AI Generation Button */}
            <div className="relative">
              <button
                onClick={handleGenerateCloudArt}
                disabled={!entry.trim() || isGenerating || isCloudGenerating}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold font-mono hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCloudGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    AI Generating (~5s)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Cloud AI
                    {!isPremium && (
                      <span className="bg-amber-400 text-[#2C3E50] text-xs px-2 py-0.5 rounded-full font-bold">
                        PRO
                      </span>
                    )}
                  </>
                )}
              </button>
              
              {/* Style picker for premium users */}
              {isPremium && (
                <button
                  onClick={() => setShowStylePicker(!showStylePicker)}
                  className="absolute -bottom-6 left-0 right-0 text-center text-xs text-purple-600 hover:text-purple-800 font-mono underline"
                >
                  Style: {STYLE_PRESETS.find(s => s.id === selectedStyle)?.name}
                </button>
              )}
              
              {/* Style picker dropdown */}
              {showStylePicker && (
                <div className="absolute top-full mt-8 left-0 bg-white border-2 border-[#2C3E50] rounded-lg shadow-lg z-10 min-w-[200px]">
                  {STYLE_PRESETS.map(style => (
                    <button
                      key={style.id}
                      onClick={() => {
                        setSelectedStyle(style.id);
                        setShowStylePicker(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-[#F4EBD9] transition-colors ${
                        selectedStyle === style.id ? 'bg-purple-100' : ''
                      }`}
                    >
                      <div className="font-mono font-bold text-[#2C3E50]">{style.name}</div>
                      <div className="font-mono text-xs text-[#2C3E50]/60">{style.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!entry.trim() || isSaving}
              className="px-6 py-2 bg-[#2C3E50] text-white font-bold font-mono hover:bg-[#1a252f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            {pixelArt && (
              <button
                onClick={handleSaveWithImage}
                disabled={isUploading}
                className="px-6 py-2 bg-[#27ae60] text-white font-bold font-mono hover:bg-[#219653] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? "Uploading..." : "Save with Image"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg font-mono">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F4EBD9] rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-mono font-bold text-[#2C3E50] mb-4">
              Upgrade to Premium
            </h2>
            <p className="font-mono text-[#2C3E50] mb-2">
              {isAtLimit
                ? "You've reached your weekly limit of 3 pixel art generations."
                : "Cloud AI generation is a premium feature."}
            </p>
            <p className="font-mono text-sm text-[#2C3E50]/60 mb-6">
              Get unlimited pixel art and cloud AI generation for just $4.99/month.
            </p>
            <button
              onClick={() => {
                setShowPaywall(false);
                router.push('/pricing');
              }}
              className="w-full bg-[#2C3E50] text-[#F4EBD9] py-3 rounded-lg font-mono font-bold hover:bg-[#1a252f] transition-colors mb-3"
            >
              Upgrade Now
            </button>
            <button
              onClick={() => setShowPaywall(false)}
              className="font-mono text-[#2C3E50] underline hover:no-underline"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
